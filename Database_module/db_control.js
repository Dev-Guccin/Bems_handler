const ExcelJS = require('exceljs')
var mysql = require('mysql')
var pgsql = require('pg')

const filePath = '../Database.xlsx'

DATABASE = []
CONNECT = {}
ERROR = {}
// key = [
//     'DB_Id',         'Details',
//     'DB_Ip',         'DB_Port',
//     'DB_Type',       'DB_Userid',
//     'DB_Userpwd',    'DB_Name',
//     'DB_TableName',  'DB_ObjectName',
//     'DB_ObjectType', 'DB_LogName',
//     'DB_LogType'
// ]

//Excel의 Database 긁어오기
async function get_database_info() {
    return new Promise(async (resolve, reject) => {//비동기로 엑셀에서 데이터를 긁어온다.
        console.log("[+] Get Excel Data : start")
        const workbook = new ExcelJS.Workbook() // 엑셀의 객체
        await workbook.xlsx.readFile(filePath)
        const sheetData = []
        const worksheet = workbook.worksheets[0]
        const options = { includeEmpty: true }
        await worksheet.eachRow(options, (row, rowNum) => {
            sheetData[rowNum] = []
            row.eachCell(options, (cell, cellNum) => {
                sheetData[rowNum][cellNum] = { value: cell.value, style: cell.style }
            })
        })
        //sheetData[0]은 비어있고, sheetData[1]은 컬럼들, sheetData[2]부터 데이터가 들어있다.
        //컬럼들로 구조체만들 key를 받아오기
        key = []
        for (let i = 1; i < sheetData[1].length; i++) {
            key.push(sheetData[1][i].value)
        }
        //DB정보를 전역변수에 담는다.
        for (let i = 2; i < sheetData.length; i++) {
            tmp = {}
            for (let j = 1; j < sheetData[i].length; j++) {
                tmp[key[j - 1]] = sheetData[i][j].value
            }
            DATABASE.push(tmp)//데이터객체를  넣어준다.
        }
        //console.log(DATABASE)
        console.log("[+] Get Excel Data : done")
        resolve(true)
    });
}
async function connect_mysql(config) {
    return new Promise((resolve, reject) => {
        var connection = mysql.createConnection(config)//연결안되면 어케 확인함?
        connection.connect(function (err) {
            if (err) {
                console.log("[-] connection fail!! / host :", config.host, err);
                connection.end()
                resolve(false)
            }
            else {
                console.log("[+] connection success / host : ", config.host)
                resolve(connection)
            }
        })
    })
}
async function connect_postgresql(config) {
    return new Promise((resolve, reject) => {
        var connection = new pgsql.Client(config);//pg의 Clinet객체를 이용하여 초기화
        connection.connect(function (err) {
            if (err) {
                console.log("[-] connection fail!! / host :", config.host, err);
                connection.end()
                resolve(false)
            }
            else {
                console.log("[+] connection success / host : ", config.host)
                resolve(connection)
            }
        })
    })
}
function set_database() {
    return new Promise(async (resolve, reject) => {
        console.log("[+] Connect Database : start")
        //DATABASE의 리스트에서 DB정보를 하나씩 꺼내와서 연결시켜놓는다.
        for (let i = 0; i < DATABASE.length; i++) {
            switch (DATABASE[i].DB_Type) {
                case 0://MS-SQL
                    console.log("This database is MS-SQL")
                    config = {
                        user: DATABASE[i].DB_Userid,
                        password: DATABASE[i].DB_Userpwd.toStrnig(),
                        database: DATABASE[i].DB_Name,
                        server: DATABASE[i].DB_Ip
                    }
                    break;
                case 1://My-SQL
                    console.log("This database is My-SQL")
                    config = {
                        host: DATABASE[i].DB_Ip,
                        port: DATABASE[i].DB_Port,
                        user: DATABASE[i].DB_Userid,
                        password: DATABASE[i].DB_Userpwd.toString(),
                        database: DATABASE[i].DB_Name,
                        connectTimeout: 5000,
                        dateStrings: 'date'
                    }
                    check = await connect_mysql(config)
                    if (check) {
                        CONNECT[DATABASE[i].DB_Id] = check;
                    }
                    break;
                case 2://Maria mysql 과 동일함
                    console.log("This database is Maria")
                    config = {
                        host: DATABASE[i].DB_Ip,
                        port: DATABASE[i].DB_Port,
                        user: DATABASE[i].DB_Userid,
                        password: DATABASE[i].DB_Userpwd,
                        database: DATABASE[i].DB_Name,
                        connectTimeout: 5000,
                        dateStrings: 'date'
                    }
                    check = await connect_mysql(config)
                    if (check) {
                        CONNECT[DATABASE[i].DB_Id] = check;
                    }
                    break;
                case 3://PostgreSQL
                    console.log("This database is postgreSQL")
                    //여기서 postgre접근한뒤 config 설정해준다.
                    config = {
                        host: DATABASE[i].DB_Ip,
                        port: DATABASE[i].DB_Port,
                        user: DATABASE[i].DB_Userid,
                        password: DATABASE[i].DB_Userpwd,
                        database: DATABASE[i].DB_Name,
                        dateStrings: 'date'//이거 되는지 아직 모름
                    }
                    check = await connect_postgresql(config)//연결이 되면 connection을 반환한다.바로 접근가능해짐
                    if (check) {
                        CONNECT[DATABASE[i].DB_Id] = check;
                    }
                    break;
                case 4://Acces
                    console.log("This database is Acces")
                    //.mdb에 접근해서 무언가 해야함.
                    break;
                default:
                    console.log("[-] This is Wrong DataType, DB_Id is :", DATABASE[i].DB_Id)
                    break;
            }
        }
        resolve(true)
        console.log("[+] Connect Database : done")
    })
}
function disconnect_all() {
    keys = Object.keys(CONNECT)
    for (let i = 0; i < keys.length; i++) {
        CONNECT[keys[i]].end()
    }
    console.log("[+] Successfully Connection Ended");
}
async function start_sending() {
    //엑셀에 접근하여 한 행마다 비동기로 데이터를 주고 받게 만들어준다.
    console.log("[+] Start Sending Data : start")
    const workbook = new ExcelJS.Workbook() // 엑셀의 객체
    await workbook.xlsx.readFile(filePath)
    const sheetData = []
    const worksheet = workbook.worksheets[1]//page 설정
    const options = { includeEmpty: true }
    await worksheet.eachRow(options, (row, rowNum) => {
        sheetData[rowNum] = []
        row.eachCell(options, (cell, cellNum) => {
            sheetData[rowNum][cellNum] = { value: cell.value, style: cell.style }
        })
    })
    //본격적인 전송시작
    //비동기로 돌기때문에 순서에 구애받지 않고 데이터를 가져오고 전송한다.
    console.log("[+] Start Sending data : working...")
    //컬럼들로 구조체만들 key를 받아오기
    key = []
    for (let i = 1; i < sheetData[1].length; i++) {
        key.push(sheetData[1][i].value)
    }
    //이걸 루프돌리면 된다.
    for (let i = 2; i < sheetData.length; i++) {
        // 데이터를 구조에 맞게 편집
        tmp = {}
        for (let j = 1; j < sheetData[i].length; j++) {
            tmp[key[j - 1]] = sheetData[i][j].value
        }
        // M_DB_Id가 존재하는지 && S_DB_Id가 존재하는지
        console.log(tmp)
        if (Object.keys(CONNECT).includes(tmp.M_DB_Id.toString()) && Object.keys(CONNECT).includes(tmp.S_DB_Id.toString())) {
            console.log("both exist")
        } else {
            console.log("can't connect")
            tmp.details = 'S_DB_Id 혹은 R_DB_Id 가 연결되어 있지 않습니다.'
            ERROR[tmp.Id] = tmp
            continue;
        }
        // SendDatabase에서 값을 긁어서 ReceiveDatabase에 수정해준다.(비동기)
        // setInterval(() => {select_update(tmp)}, 2000);
        select_update(tmp)
    }
}
function set_log_datatype(M_database, S_database, value){
    var tmp;
    switch (S_database.DB_LogType) {
        case 'int':
            tmp = parseFloat(value[0][M_database.DB_LogName]);
            break;
        case 'float':
            tmp = parseInt(value[0][M_database.DB_LogName]);
            break
        case 'char':
            tmp = "'" + value[0][M_database.DB_LogName] + "'"
            break
        default:
            break;
    }
    return `SET ${S_database.DB_LogName}=${tmp}`
}
function set_control_datatype(M_database, S_database, value) {
    //데이터가 존재하는 경우
    if (S_database.DB_ControlName != undefined && M_database.DB_ControlName != undefined) {//둘다 컨트롤 값을 가지는 경우만 반환
        //데이터 형식에 맞춰주어야 한다.
        var tmp
        switch (S_database.DB_ControlType) {
            case "int":
                tmp = parseInt(value[0][M_database.DB_ControlName])
                break;
            case "float":
                tmp = parseFloat(value[0][M_database.DB_ControlName])
                break;
            case "char":
                tmp = "'" + value[0][M_database.DB_ControlName] + "'"
                break;
            default:
                break;
        }
        //
        return ` ,${S_database.DB_ControlName}=${tmp}`
    } else {
        return ``;
    }
}
function set_time_datatype(M_database, S_database, value) {
    //데이터가 존재하는 경우
    if (S_database.DB_TimeName != undefined && M_database.DB_TimeName != undefined) {//둘다 타임값을 가지는 경우만 반환
        //데이터 형식에 맞춰주어야 한다.
        var tmp
        switch (S_database.DB_TimeType) {
            case "datetime":
                tmp = "'"+(value[0][M_database.DB_TimeName])+"'";
                break;
            default:
                break;
        }
        //
        return ` ,${S_database.DB_TimeName}=${tmp}`
    } else {
        return ``;
    }
}
async function select_update(row) {
    //table명, object명, 등등을 받아서 query를 날려야함.
    var M_database;
    var S_database;
    for (let i = 0; i < DATABASE.length; i++) {
        if (DATABASE[i].DB_Id == row.M_DB_Id) {
            M_database = DATABASE[i]
        }
        if (DATABASE[i].DB_Id == row.S_DB_Id) {
            S_database = DATABASE[i]
        }
        if (M_database != undefined && S_database != undefined) {
            console.log("[ ] find M_database and S_database")
            break;
        }
    }
    if (M_database == undefined || S_database == undefined) {//둘중에 데이터가 하나가 비어있거나 매칭이 안되는경우
        console.log("[-] Database ID is wrong")
        console.log("[.] check table : ", row)
        tmp.details = 'M_database 혹은 S_Database의 정보를 불러올 수 없습니다.'
        ERROR[row.Id] = row
        return // 계산하지 않고 함수 종료시킨다
    }
    console.log(row)
    //ObjectName의 형식이 int거나 char일수 있으므로 이에대한 필터링이 필요함
    sqlstring = `SELECT * from ${M_database.DB_TableName} ` +
        `where ${M_database.DB_ObjectName}=${M_database.DB_ObjectType == "char" ? "'" + row.M_Objectname + "'" : row.M_Objectname};`
    //
    var value = await (async function () {
        return new Promise((resolve, reject) => {
            CONNECT[row.M_DB_Id.toString()].query(sqlstring, (err, res) => {
                if (err) {
                    console.log(err)
                    row.details = '데이터를 SELECT하는데 오류가 있습니다.'
                    ERROR[row.Id] = row
                    resolve()
                } else {
                    console.log(res)
                    //값이 비어있는 경우 있을 수 있음.
                    if (res.length == 0) {
                        row.details = 'SELECT한 데이터가 비어있습니다. 즉, M_Objectname을 확인해보세요.'
                        ERROR[row.Id] = row
                        resolve()
                    }
                    resolve(res)
                }
            })
        })
    })()
    if (value == undefined) {
        return
    }
    console.log(value)
    //ObjectName의 형식이 int거나 char일수 있으므로 이에대한 필터링이 필요함
    console.log(M_database.DB_LogName)
    sqlstring = `UPDATE ${S_database.DB_TableName} ` +
        `${set_log_datatype(M_database, S_database, value)}` +
        `${set_control_datatype(M_database, S_database, value)}` +
        `${set_time_datatype(M_database, S_database, value)}` +
        ` WHERE ${S_database.DB_ObjectName}=${S_database.DB_ObjectType == 'char' ? "'" + row.S_Objectname + "'" : row.S_Objectname};`
    //
    console.log("@@@@@@@@@@@@@@@",sqlstring)
    CONNECT[row.S_DB_Id.toString()].query(sqlstring, (err, res) => {
        if (err) {
            console.log(err)
            row.details = '데이터가 UPDATE하는데 문제가 발생했습니다. 즉, S_Objectname을 확인해보세요.'
            ERROR[row.Id] = row
        } else {
        }
    })
}

async function main() {
    await get_database_info()//DB의 정보를 받는다.
    //DB의 정보를 받았기 때문에 각 객체에 대해 sql 연결을 진행한다.
    await set_database()
    //Excel에서 다시 데이터를 하나씩 받으며 통신을 시작한다. (비동기로 진행한다)
    intervaltime = 2000
    //setInterval(()=>start_sending(),intervaltime)
    start_sending()
    //통신이 종료되면 모든 CONNECT의 값들을 end시킨다.(아마 쓸일 거의 없을듯)
    //disconnect_all();
}
main()

process.on('SIGINT', function () {
    console.log("[+] Caught ninterrupt sigal");
    console.log("[+] Error list:", ERROR)
    process.exit();
});