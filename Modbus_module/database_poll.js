const DBH = require('./database.js')
var mysql = require('mysql')
var pgsql= require('pg')

const net = require('net')
const { timeStamp } = require('console')
const { stringify } = require('querystring')
error_list = []

function Database() {
    db_id = 0
    db_ip = "",
    db_port = 0,
    db_type = "",
    db_userid = "",
    db_userpwd = "",
    db_name = "",
    db_tablename = "",
    object_name = "",
    log_value = "",
    lv_type = "",
    ctrl_value = "",
    cv_type = "",
    log_time = "",
    lt_type = "",
    object_type = ""
}
function iso_to_datetime(date){
    date = new Date(date);
    year = date.getFullYear();
    month = date.getMonth()+1;
    dt = date.getDate();
    hour = date.getHours();
    min = date.getMinutes();
    sec = date.getSeconds();
    if (dt < 10) {dt = '0' + dt;}
    if (month < 10) { month = '0' + month; }
    console.log(year+'-' + month + '-'+dt+" "+hour+":"+min+":"+sec);
    time = year+'-' + month + '-'+dt+" "+hour+":"+min+":"+sec
    return time
}
function insert_realtime_table(db_row, result){
    result.forEach(row => {
        tmp = []
        // object_name과 logvalue는 필수이기 때문에 바로 tmp에 삽입한다.
        tmp.push(row[db_row.object_name], row[db_row.log_value], 
            row[db_row.ctrl_value],
            db_row.object_type, "db", db_row.db_id)
        console.log(tmp);
        time_value = row[db_row.log_time]===undefined? false:iso_to_datetime(row[db_row.log_time])
        // 넣은 값을 만들었기 때문에 realtime_table에 삽입한다.
        DBH.insert_realtime_table(tmp, time_value)
    });
}
async function dabase_type_check(db_row) {
    return new Promise(function (resolve, reject) {
        var config
        console.log("start type check:", db_row)
        switch (db_row.db_type) {
            case 0://MS-SQL
                console.log("this database is MS-SQL")
                config = {
                    user: db_row.db_userid,
                    password: db_row.db_userpwd,
                    database: db_row.db_name,
                    server: db_row.db_ip
                }
                break;
            case 1://My-SQL
                console.log("this database is My-SQL")
                config = {
                    host: db_row.db_ip,
                    port: db_row.db_port,
                    user: db_row.db_userid,
                    password: db_row.db_userpwd,
                    database: db_row.db_name
                }
                var connection = mysql.createConnection(config)//연결안되서 터지면?
                connection.connect(function(err) {
                    if (err) {
                        console.error('error connecting: ' + err.stack);
                        error_list.push(config)
                        connection.end()
                        resolve(false)
                    }else{
                        var tmp = connection.query(`SELECT * from ${db_row.db_tablename};`, config, (error, rows, fields) => {
                            if (error) {
                                console.log(error)
                                error_list.push(config)
                                connection.end()
                                resolve(false)
                            }
                            else {//DB접근에 문제가 없는 경우
                                console.log(rows);
                                //데이터를 형식에 맞게 가져온다.???
                                connection.end()
                                insert_realtime_table(db_row, rows)
                                resolve(true)
                            }
                        })
                    }
                })
                break;
            case 2://Maria mysql 과 동일함
                console.log("this database is Maria")
                config = {
                    host: db_row.db_ip,
                    port: db_row.db_port,
                    user: db_row.db_userid,
                    password: db_row.db_userpwd,
                    database: db_row.db_name
                }
                var connection = mysql.createConnection(config)//연결안되서 터지면?
                connection.connect(function(err) {
                    if (err) {
                        console.error('error connecting: ' + err.stack);
                        error_list.push(config)
                        connection.end()
                        resolve(false)
                    }else{
                        var tmp = connection.query(`SELECT * from ${db_row.db_tablename};`, config, (error, rows, fields) => {
                            if (error) {
                                console.log(error)
                                error_list.push(config)
                                connection.end()
                                resolve(false)
                            }
                            else {//DB접근에 문제가 없는 경우
                                console.log(rows);
                                //데이터를 형식에 맞게 가져온다.???
                                connection.end()
                                insert_realtime_table(db_row, rows)
                                resolve(true)
                            }
                        })
                    }
                })
                break;
            case 3://PostgreSQL
                console.log("this database is postgreSQL")
                //여기서 postgre접근한뒤 config 설정해준다.
                config = {
                    host: db_row.db_ip,
                    port: db_row.db_port,
                    user: db_row.db_userid,
                    password: db_row.db_userpwd,
                    database: db_row.db_name,
                }
                var connection = new pgsql.Client(config);//pg의 Clinet객체를 이용하여 초기화
                connection.connect(function(err) {
                    if (err) {
                        console.error('error connecting: ' + err.stack);
                        error_list.push(config)
                        connection.end()
                        resolve(false)
                    }else{
                        connection.query(`SELECT * from ${db_row.db_tablename};`, (err, res) => {
                            if (err) {
                                console.log(err)
                                error_list.push(config)
                                connection.end()
                                resolve(false)
                            }
                            else {//DB접근에 문제가 없는 경우
                                console.log(res.rows);
                                //데이터를 형식에 맞게 가져온다.???
                                connection.end()
                                insert_realtime_table(db_row, res.rows)
                                resolve(true)
                            }
                        })
                    }
                })
                break;
            case 4://Acces
            console.log("this database is Acces")
                //.mdb에 접근해서 무언가 해야함.

                break;
            case 5://Excel
            console.log("this database is Excel")
                break;
            case 5://Text
            console.log("this database is Text")
                break;
            default:
            console.log("this is not option")
                break;
        }
    })
}
async function DatabaseStart() {
    //데이터 베이스의 개수를 가져오기
    //get db_id => 리스트에 담고 하나씩 가져오면서 통신을 진행한다.
    id_list = await DBH.database_get_ids()
    console.log(id_list)
    for (let i = 0; i < id_list.length; i++) {//id당 데이터를 받아온다.
        db_row = await DBH.database_get_row(id_list[i])
        //db종류가 먼지
        console.log("What DB type?");
        result = await dabase_type_check(db_row)
        if (result == false){
            continue
        }
        console.log("result:",result)
    }
    console.log(error_list)
}
DatabaseStart()