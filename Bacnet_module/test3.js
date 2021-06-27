const bacnet = require('node-bacnet');
const { mainModule } = require('process');
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
async function main(){
    
    tmp = await client.readPropertyMultiple('192.168.0.89', requestArray, async function(err, value){
        console.log('result: ', value.values[0].values[0].value);
        console.log('result: ', value.values[0].values[1].value);
        return new Promise((resolve, reject)=>{
            resolve("test")
        })
        // console.log('result: ', value.values[1]);
        // console.log('result: ', value.values[1].values[0].value);
        // console.log('result: ', value.values[1].values[1].value);
    });
    console.log(tmp)
}
main()