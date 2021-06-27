var mysql = require('mysql')
var dbconfig = {
    host     : 'localhost',
    user     : 'root',
    password : '4msys',
    database : 'bems'
  }
const connection = mysql.createConnection(dbconfig);
connection.connect();

var Database = {
    device_select: function(table, callback){
        return new Promise(function(resolve, reject) {
            connection.query(`SELECT * from ${table}`, (error, rows, fields) => {
                if (error) throw error;
                resolve(rows);
            })
        })
    },
    device_delete:  function(tablename){
        return new Promise(function(resolve, reject) {
            connection.query(`DELETE FROM ${tablename}` , (error, rows, fields) => {
                if (error) throw error;
                resolve();
            });
          });
    },
    channel_inc_tx: function(id){
        return new Promise(function(resolve, reject) {
            connection.query(`UPDATE modbus_channels SET tx = (tx + 1)%1000 
            WHERE id = ${id}` , (error, rows, fields) => {
                if (error) throw error;
                resolve();
            });
          });
    },
    channel_inc_rx: function(id){
        return new Promise(function(resolve, reject) {
            connection.query(`UPDATE modbus_channels SET rx = (rx + 1)%1000 
            WHERE id = ${id}` , (error, rows, fields) => {
                if (error) throw error;
                resolve();
            });
          });
    },
    channel_inc_err: function(id){
        return new Promise(function(resolve, reject) {
            connection.query(`UPDATE modbus_channels SET err = (err + 1)%1000 
            WHERE id = ${id}` , (error, rows, fields) => {
                if (error) throw error;
                resolve();
            });
          });
    },
    device_insert: function(page,data){
        if(page == 0){//Channel
            return new Promise(function(resolve, reject) {
                try{
                connection.query(`INSERT INTO modbus_ip (id,name,com_type,ip_address,port,period,wait_time,active) 
                VALUES(${data.Id},'${data.Name}','${data.ComType}','${data.IpAddress}',${data.Port},${data.Period},${data.WaitTime},${data.Active})`, (error,rows,field) => {
                    if(error) throw error;
                    resolve();
                });
                }catch(e){
                    console.log(e)
                }
    
              });
        }
        else if(page == 1){//Frame
            return new Promise(function(resolve, reject) {
                try{
                connection.query(`INSERT INTO modbus_channels (id,name,channel_id,function_code,device_address,start_address,read_byte,active)
                VALUES(${data.Id},'${data.Name}',${data.ChannelId},${data.FunctionCode},${data.DeviceAddress},${data.StartAddress},${data.ReadByte},${data.Active})`,(error,rows,field) => {
                    if(error) throw error;
                    resolve();
                });
                }catch(e){
                    console.log(e)
                }
              });
        }
        else{//Detail
            return new Promise(function(resolve, reject) {
                try{
                connection.query(`INSERT INTO modbus_details (object_name,object_type,id,units,low_limit,high_limit,m_enable,m_ip,m_channel ,m_func ,m_addr ,m_offsetbit ,m_dattype ,m_r_scale ,m_r_offset ,m_w_ip ,m_w_id ,m_w_fc ,m_w_addr ,m_w_dattype ,m_w_scale ,m_w_offset )
                VALUES('${data.object_name}','${data.object_type}',${data.id},'${data.units}','${data.low_limit}','${data.high_limit}',${data.m_enable},${data.m_ip},${data.m_channel},${data.m_func},${data.m_addr},${data.m_offsetbit},${data.m_datatype},${data.m_r_scale},${data.m_r_offset},${data.m_w_ip},${data.m_w_id},${data.m_w_fc},${data.m_w_addr},${data.m_w_datatype},${data.m_w_scale},${data.m_w_offset})`, (error,rows,field) => {
                    if(error) throw error;
                    resolve();
                });
                }catch(e){
                    console.log(e)
                }
              });
           }
       
    },
    database_insert:function(data){
        console.log(data)
        connection.query('INSERT database_details VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);', data, (error, rows, fields) => {
            if (error) throw error;
            console.log("inert success")
        })
    },
    database_get_ids:async function(){
        return new Promise(function(resolve, reject){
            connection.query('SELECT db_id FROM database_details;', (error, rows, fields) => {
                if (error) throw error;
                console.log(rows)
                db_ids = []
                for(let i= 0; i<rows.length; i++){
                    db_ids.push(rows[i].db_id)
                }
                resolve(db_ids)
            });
        });
       
    },
    database_get_row:async function(db_id){
        return new Promise(function(resolve, reject){
            connection.query('SELECT * FROM database_details where db_id=?',[db_id], (error, rows, fields) => {
                if (error) throw error;
                resolve(rows[0])
            });
        });
        
    },
    realtime_upsert:function(id,object_name, resData,object_type){
        connection.query(`insert into realtime_table (id,object_name, logvalue, logtime,object_type, com_type)
        values (${id},'${object_name}', ${resData}, now(),'${object_type}','mysql') as t
        on duplicate key update logvalue = t.logvalue, logtime = t.logtime`, (error, rows, fields) => {
            if (error) throw error;
        });
        // connection.end();
        
    },
    batch_device_select : function(table, callback){
        connection.query(`SELECT * from ${table}`, (error, rows, fields) => {
            if (error) throw error;
            callback(rows);
        })
    },
    batch_insert: function(table_name, object_name, value){
        connection.query(`INSERT INTO ${table_name} (object_name, logtime, logvalue) 
        VALUES ("${object_name}",now(),${value})`, (error, rows, fields) => {
            if (error) throw error;
        });
        
    },
    batch_select : function(table_name,object_name, time_interval,callback){
        connection.query(`SELECT avg(logvalue) from ${table_name} where object_name = "${object_name}" and logtime between timestamp(DATE_SUB(NOW(), INTERVAL ${time_interval})) and timestamp(NOW())`, (error, rows, fields) => {
            if (error) throw error;
            callback(rows);
        });
    }
}
module.exports = Database