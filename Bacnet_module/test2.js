const bacnet = require('node-bacnet');
const client = new bacnet({
    port: 47808,                          // Use BAC1 as communication port
    interface: '192.168.0.85',          // Listen on a specific interface
    broadcastAddress: '192.168.0.255',  // Use the subnet broadcast address
    apduTimeout: 10000                     // Wait twice as long for response
});

const requestArray = [
    {
        objectId: { type: 0, instance: 800 }, properties: [
             { id: 85 }
        ]
    }
];
// client.readProperty('192.168.0.19:58833', {type: 0, instance: 1}, 85, (err, value) => {
//     console.log('!!!!!!!value: ', value);
//   });
client.readPropertyMultiple('192.168.0.85', requestArray, (err, value) => {
    console.log('result: ', value.values[0].values[0].value);
    console.log('result: ', value.values[0].values[1].value);
    // console.log('result: ', value.values[1]);
    // console.log('result: ', value.values[1].values[0].value);
    // console.log('result: ', value.values[1].values[1].value);
});

// client.writeProperty('192.168.0.19:58833', {type: 2, instance: 2}, 85, [
// { type: bacnet.enum.ApplicationTag.REAL, value: 1000 }
//   ],(err, value) => {
//       if (err){
//           console.log(err)
//       }
//     console.log('value: ', value);
// });

/*const values = [
    {objectId: {type: 2, instance: 1}, values: [
      {property: {id: 85, index: 4294967295}, value: [{type: bacnet.enum.ApplicationTag.REAL, value: 1000}], priority: 8}
    ]}
  ];
  client.writePropertyMultiple('192.168.0.19:58833', values, (err, value) => {
    console.log('value: ', value);
  });*/