const ExcelJS = require('exceljs')
const DBH  = require('./database.js')

const filePath = './DatabaseExcel.xlsx'

var Excel = {
    loadExcelFile: async function(filepath){
        console.log("start insert")
        const workbook = new ExcelJS.Workbook() // 엑셀의 객체
        await workbook.xlsx.readFile(filePath)
        const sheetData = []
        const worksheet = workbook.worksheets[0]
        const options = { includeEmpty: true }
        await worksheet.eachRow(options, (row, rowNum) => {
            sheetData[rowNum] = []
            row.eachCell(options, (cell, cellNum) => {
                sheetData[rowNum][cellNum] = { value:cell.value, style:cell.style }
            })
        })
        //sheetData[0]은 비어있고, sheetData[1]은 컬럼들, sheetData[2]부터 데이터가 들어있다.
        DBH.device_delete("database_details")//DB정리시킨다.
        for (let i = 2; i < sheetData.length; i++) {
            if(sheetData[i].length == 17){
                insert_data = []
                for(let j = 1; j<17; j++){
                    insert_data.push(sheetData[i][j].value)
                }
                DBH.database_insert(insert_data);
            }
        }
        console.log("done")
    }
}
Excel.loadExcelFile()
module.exports = Excel