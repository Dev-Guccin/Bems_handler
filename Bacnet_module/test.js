const bacnet = require('node-bacnet');
const client = new bacnet({
  port: 47808,                          // Use BAC1 as communication port
  interface: '192.168.0.19',          // Listen on a specific interface
  broadcastAddress: '192.168.0.255',  // Use the subnet broadcast address
  apduTimeout: 100000                     // Wait twice as long for response
});
  client.whoIs("192.168.0.255"); // 반드시 255로 해줘야 전체 네트워크에서 반응
  
  client.on('iAm', (msg) => {
    console.log("iam : ",msg)
    console.log(
      'address: ', msg.header.sender.address,
      ' - deviceId: ', msg.payload.deviceId,
      ' - maxApdu: ', msg.payload.maxApdu,
      ' - segmentation: ', msg.payload.segmentation,
      ' - vendorId: ', msg.payload.vendorId
      );
    });
    
    
    client.on('whoIs', (msg) => {
      console.log("whois:",msg)
      console.log(
        'address: ', msg.header.sender,
        ' - lowLimit: ', msg.payload.lowLimit,
        ' - highLimit: ', msg.payload.highLimit
        );
      });