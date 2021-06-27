const mysql = require('mysql')
let dbconfig = {
    host: 'localhost',
    user: 'root',
    password: '4msys',
    database: 'bems'
}
const connection = mysql.createConnection(dbconfig);
connection.connect();

const Database = {
    select_table: function (table, callback) {
        // connection = mysql.createConnection(dbconfig);
        // connection.connect();
        return new Promise(function (resolve, reject) {
            connection.query(`SELECT * from ${table}`, (error, rows, fields) => {
                if (error) throw error;
                // connection.end();
                resolve(rows);
            })
        })
    },
    delete_table: function (tablename) {
        // // console.log("delete table name ",tablename)
        // connection = mysql.createConnection(dbconfig);
        // connection.connect();
        return new Promise(function (resolve, reject) {
            connection.query(`DELETE FROM ${tablename}`, function (err) {
                // connection.end();
                if(err){console.log(err); resolve(false)}
                resolve();
            });
        });
    },
    insert_table: function (page, data) {
        // console.log("insert table name ",page)
        // connection = mysql.createConnection(dbconfig);
        // connection.connect();
        if (page == 0) {//Device
            return new Promise(function (resolve, reject) {
                connection.query(`INSERT INTO bacnet_device (id,name,ip_address,port,period,active,available) 
                VALUES(${data.Id},'${data.Name}','${data.IpAddress}',${data.Port},${data.Period},${data.Active},${data.Available})`, function(error, rows, fields)  {
                    // connection.end();
                    if(error){
                        console.log(error)
                        resolve(false)
                    }
                    resolve();
                });
            });
        }
        else {//Station
            return new Promise(function (resolve, reject) {
                connection.query(`INSERT INTO bacnet_station (id,name,device_id,object,object_type,object_instance,value_type,active)
                VALUES(${data.Id},'${data.Name}',${data.DeviceId},'${data.Object}',${data.Object_type},${data.Object_instance},${data.Value_type},${data.Active})`, function (error, rows, fields)  {
                    // connection.end();
                    if(error){
                        console.log(error)
                        resolve(false)
                    }
                    resolve();
                });
            });
        }
    },
    set_available: function (data) {
        //ipaddress
        ipadr = data.split(":")
        console.log(ipadr)
        connection.query(`UPDATE bacnet_device SET available=1 WHERE ip_address='${ipadr[0]}' and port=${ipadr[1]!=undefined?parseInt(ipadr[1]):47808};`, function (error, rows, fields) {
            if(error){
                console.log(error)
            }
            else{
            }
        });
    },
    reset_available: function () {
        connection.query(`UPDATE bacnet_device SET available=0;`, function (error, rows, fields) {
            if(error){
                console.log(error)
            }
            else{
            }
        });
    },
    get_ids_device:async function(){
        return new Promise(function(resolve, reject){
            connection.query(`SELECT id FROM bacnet_device;`, function (error, rows, fields) {
                if(error){
                    console.log(error)
                    resolve()
                }
                else{
                    resolve(rows)
                }
            });
        })
    },
    get_ids_device_available: function(id){
        return new Promise(function(resolve, reject){
            connection.query(`SELECT id,period FROM bacnet_device WHERE id=${id} and active=1 and available=1;`, function (error, rows, fields) {
                if(error){
                    console.log(error)
                    resolve()
                }
                else{
                    resolve(rows[0])
                }
            });
        })
    },
    get_device_from_id: function(id){
        return new Promise(function(resolve, reject){
            connection.query(`SELECT * FROM bacnet_device WHERE id=${id};`, function (error, rows, fields) {
                if(error){
                    console.log(error)
                    resolve()
                }
                else{
                    resolve(rows[0])
                }
            });
        })
    },
    get_ids_station: function(device_id){
        console.log("get_ids_station:",device_id)
        return new Promise(function(resolve, reject){
            connection.query(`SELECT id FROM bacnet_station WHERE device_id=${device_id};`, function (error, rows, fields) {
                if(error){
                    console.log(error)
                    resolve()
                }
                else{
                    resolve(rows)
                }
            });
        })
    },
    get_station_from_id: function(id){
        return new Promise(function(resolve, reject){
            connection.query(`SELECT * FROM bacnet_station WHERE id=${id};`, function (error, rows, fields) {
                if(error){
                    console.log(error)
                    resolve()
                }
                else{
                    resolve(rows[0])
                }
            });
        })
    },
    realtime_upsert: function (id, object_name, resData, object_type) {
        console.log("INSERT!!! ", id, object_name, resData, object_type)
        connection.query(`insert into realtime_table (id,object_name, logvalue, logtime,object_type, com_type)
        values (${id},'${object_name}', ${resData}, now(),'${object_type}','bacnet') as t
        on duplicate key update logvalue = t.logvalue, logtime = t.logtime`, (error, rows, fields) => {
            if (error) throw error;
        });
    },
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    database_insert: function (data) {
        // connection = mysql.createConnection(dbconfig);
        // connection.connect();
        console.log(data)
        connection.query('INSERT database_details VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);', data, (error, rows, fields) => {
            if (error) throw error;
            console.log("inert success")
        })
        // connection.end();
    },
    database_get_ids: async function () {
        // connection = mysql.createConnection(dbconfig);
        // connection.connect();
        return new Promise(function (resolve, reject) {
            connection.query('SELECT db_id FROM database_details;', (error, rows, fields) => {
                if (error) throw error;
                console.log(rows)
                db_ids = []
                for (let i = 0; i < rows.length; i++) {
                    db_ids.push(rows[i].db_id)
                }
                resolve(db_ids)
            });
            // connection.end();
        });

    },
    database_get_row: async function (db_id) {
        // connection = mysql.createConnection(dbconfig);
        // connection.connect();
        return new Promise(function (resolve, reject) {
            connection.query('SELECT * FROM database_details where db_id=?', [db_id], (error, rows, fields) => {
                if (error) throw error;
                resolve(rows[0])
            });
            // connection.end();
        });

    },
    
    // realtime_insert: function(data){
    //     connection.query(`insert realtime_table(object_name,logtime,object_type,com_type) 
    //     values('${data.object_name}',now(),'${data.object_type}','mysql')`,(error, rows, fields) => {
    //         if (error) throw error;
    //     });
    // },
    batch_device_select: function (table, callback) {
        // connection = mysql.createConnection(dbconfig);
        // connection.connect();
        connection.query(`SELECT * from ${table}`, (error, rows, fields) => {
            if (error) throw error;
            // connection.end();
            callback(rows);
        })
    },
    batch_insert: function (table_name, object_name, value) {
        // connection = mysql.createConnection(dbconfig);
        // connection.connect();
        connection.query(`INSERT INTO ${table_name} (object_name, logtime, logvalue) 
        VALUES ("${object_name}",now(),${value})`, (error, rows, fields) => {
            if (error) throw error;
            // connection.end();
        });

    },
    batch_select: function (table_name, object_name, time_interval, callback) {
        // connection = mysql.createConnection(dbconfig);
        // connection.connect();
        connection.query(`SELECT avg(logvalue) from ${table_name} where object_name = "${object_name}" and logtime between timestamp(DATE_SUB(NOW(), INTERVAL ${time_interval})) and timestamp(NOW())`, (error, rows, fields) => {
            if (error) throw error;
            // connection.end();
            callback(rows);
        });

    }
}
module.exports = Database