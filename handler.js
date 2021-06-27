const fs = require('fs');

const article = fs.readFileSync("config.txt");
lineArray = article.toString().split('\n');
// modbus사용가능한지 확인
// bacnet사용가능한지 확인
// database사용하는지 확인
let active = new Array()
console.log(lineArray)
for (let i = 1  ; i < lineArray.length; i++) {
    console.log(lineArray[i])
    console.log(lineArray[i].split("=")[1])
    if (lineArray[i].split("=")[1] == 1)
        active.push(1)
    else
        active.push(0)
}
console.log(active)
// 이제 active에 따라 modebus, bacnet, database의 모듈을 pm2로 하부에서 실행시킨다.
// pm2 로 해당 모듈들 종료시킨다.
// pm2 해당 모듈 실행
