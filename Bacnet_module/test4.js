const DBH = require('./database.js')

async function main(){
    let tmp = await DBH.get_ids_device_available(1)
    console.log(tmp)
}
main()