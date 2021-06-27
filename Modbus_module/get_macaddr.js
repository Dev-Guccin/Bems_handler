var macaddress = require('macaddress');

 var addr1 = macaddress.networkInterfaces()["vEthernet (Default Switch)"]["mac"]
 console.log("addr1", addr1)
 if (addr1 == "00:15:5d:a2:be:e1") {//mac address가 "00:15:5d:a2:be:e1"인 경우
     console.log("work")
 }