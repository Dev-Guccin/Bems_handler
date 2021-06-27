const ExcelJS = require('exceljs')
const DBH  = require('./database.js')

const filePath = '../Bacnet.xlsx'

let DEVICE={
    Id :'',
    Name : '',
    IpAddress : '',
    Port : '',
    Period : '',
    Active : '',
    Available: ''
}
let STATION={
    Id : '',
    Name : '',
    DeviceId : '',
    Object : '',
    Object_type:'',
    Object_instance:'',
    Value_type:'',
    Active : ''
}
let Excel = {
    loadExcelFile:  function(filepath){
        return new Promise(async function(resolve, reject) {
            try{
                const workbook = new ExcelJS.Workbook() // 엑셀의 객체
                await workbook.xlsx.readFile(filePath)
                for (let page = 0; page < 2; page++) {
                    const sheetData = []
                    const worksheet = workbook.worksheets[page] // 첫 번째 sheet 선택
                    const options = { includeEmpty: true }
                    // worksheet에 접근하여 데이터를 읽어옴
                    await worksheet.eachRow(options, (row, rowNum) => {
                        sheetData[rowNum] = []
                        row.eachCell(options, (cell, cellNum) => {
                            sheetData[rowNum][cellNum] = { value:cell.value, style:cell.style }
                        })
                    })
                    if( page == 0){ // Device 페이지
                        await DBH.delete_table('bacnet_device')// DB깔끔하게 밀어버리기
                        for (let i = 2; i < sheetData.length; i++) {
                            if(sheetData[i][1].value == "*") break 
                            DEVICE.Id           =sheetData[i][1].value
                            DEVICE.Name	        =sheetData[i][2].value
                            DEVICE.IpAddress	=sheetData[i][3].value
                            DEVICE.Port		    =sheetData[i][4].value
                            DEVICE.Period		=sheetData[i][5].value
                            DEVICE.Active		=sheetData[i][6].value
                            DEVICE.Available	=sheetData[i][7].value
                            // 이걸 DB에 저장해야함
                            //console.log(DEVICE)
                            await DBH.insert_table(page, DEVICE)
                            // console.log("DEVICE",DEVICE.Id)
                        }
                    }
                    else if(page ==1){//Station 페이지
                        await DBH.delete_table('bacnet_station')// DB깔끔하게 밀어버리기
                        for (let i = 2; i < sheetData.length; i++) {
                            if(sheetData[i][1].value == "*") break
                            STATION.Id              =sheetData[i][1].value
                            STATION.Name	        =sheetData[i][2].value
                            STATION.DeviceId		=sheetData[i][3].value
                            STATION.Object		    =sheetData[i][4].value
                            STATION.Object_type	    =sheetData[i][5].value
                            STATION.Object_instance	=sheetData[i][6].value
                            STATION.Value_type	=sheetData[i][7].value
                            STATION.Active		    =sheetData[i][8].value
                            // 이걸 DB에 저장해야함
                            //console.log(STATION)
                            await DBH.insert_table(page, STATION)
                        }
                    }
                }
                console.log("get_excel완료")
                resolve()
            }catch(e){
                console.log("load excel error : " ,e)
                resolve()
            }
        });
    }
}
module.exports = Excel