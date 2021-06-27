const DBH = require('./database.js')
var Excel = require('./get_excel.js')

const bacnet = require('node-bacnet');
const bacnetConfig = require('./config.json');
const client = new bacnet(bacnetConfig);
let checkArray = new Array()
let checkTimeArray = new Array()

client.on('iAm', (msg) => {
    console.log("iam : ", msg)
    //데이터 받으면 DB에 넣어주기
    DBH.set_available(msg.header.sender.address)
});
client.on('whoIs', (msg) => {
});
async function main() {
    //1. 엑셀의 설정을 db로 옮긴다.
    await Excel.loadExcelFile()

    //2. whois로 존재하는 오브젝트들 확인 → active
    client.whoIs(bacnetConfig.broadcastAddress) 
    setInterval(() => { client.whoIs(bacnetConfig.broadcastAddress) }, 1000*60*4)//1분마다 보내기
    //client.whoIs(bacnetConfig.broadcastAddress)

    console.log("[+] start data polling....")
    //3. id들을 전부 가져옴
    let idslist = await DBH.get_ids_device()
    //3. db station에서 데이터를 읽는다.
    for (let i = 0; i < idslist.length; i++) { //배열 초기화
        checkArray[i] = 1
        checkTimeArray[i] = -(new Date())
    }
    setInterval(()=>{DBH.reset_available()}, 1000*60*5)//5분마다 통신 재설정
    setInterval(async() => {
        //여기서 가능한지 확인한다
        for (let i = 0; i < idslist.length; i++) {
            let idperiod = await DBH.get_ids_device_available(idslist[i].id)
            if(idperiod == undefined) continue
            if (checkArray[i] == 1 && (new Date()) - checkTimeArray[i] > idperiod.period) {//완료된 경우 다시 실행
                bacnet_device_poll(i, idperiod.id)
                checkArray[i] = 0//진행중
                checkTimeArray[i] = new Date()
            }
        }
    }, 2000)
}

async function bacnet_device_poll(i, id) {
    // device의 id에 해당하는 열들을 list로 받는다.
    //console.log("[+] get ids from station id:", id)
    let device = await DBH.get_device_from_id(id)

    let ip_address = `${device.ip_address}` + (device.port == -1 ? "" : ":" + device.port)
    //console.log("[+] connect to ip:", ip_address)

    let idslist = await DBH.get_ids_station(id)
    //console.log("[+] available ids device:", id, " idslist:", idslist, " length:", idslist.length)
    //console.log("[+++] create requestArray")

    let requestArray = new Array()
    let station = new Array()
    for (let i = 0; i < idslist.length; i++) {
        station[i] = await DBH.get_station_from_id(idslist[i].id)
        //console.log("station : ", station[i])
        if (station[i].active != 1) continue
        requestArray[i] = { objectId: { type: station[i].object_type, instance: station[i].object_instance }, properties: [{ id: 85 }] }
    }
    await sync_readPropertyMultiple(ip_address, requestArray, station)
    //console.log("[-]종료")
    checkArray[i] = 1//통신이 종료되었다는 의미
}
function sync_readPropertyMultiple(ip_address, requestArray, station) {
    return new Promise((resolve, reject) => {
        client.readPropertyMultiple(ip_address, requestArray, (err, value) => {
            if (err) {
                console.log(err)
                resolve()
            }
            if (value) {
                //데이터를 받았으니 이제 값을 realtime_table에 넣어준다.
                for (let i = 0; i < value.values.length; i++) {
                    element = value.values[i]
                    if (typeof (element.values[0].value[0].value) == typeof ({}))
                        continue
                    DBH.realtime_upsert(station[i].id, station[i].name, element.values[0].value[0].value, station[i].object)
                }
                //통신도 끝나고 DB작업도 끝났기 때문에 동기 방식을 종료한다.
                resolve()
            }
        })
    })

}
main()