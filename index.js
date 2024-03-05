import { Worker } from "worker_threads";
import { config } from './config.js'

const NUMBER_OF_SIMULATION = 5
var totalPay = 0

function createSpin(spinId){
    // generateSpin -> getPay
    const worker = new Worker("./spin.js",{
        workerData: { spinId: spinId },
    });

    // calculatePayForThisSpin
    worker.on("message", (data) => {
      console.log(`result is ${data}`);
      return data.pay;
    });
    
    worker.on("error", (msg) => {
      console.error(`An error occurred: ${msg}`);
    });
    
}

function calculateTotalPay() {
    for (var i = 0; i < NUMBER_OF_SIMULATION; i++){
        var pay = createSpin(i)
        totalPay += pay
        console.log(totalPay);
        
    }
    console.log("Returning pay: " + totalPay);
    return totalPay
    // return new Promise((resolve, reject) => {
    //     for (var i = 0; i < NUMBER_OF_SIMULATION; i++){
    //         var pay = createSpin(i)
    //         totalPay += pay
    //     }
    //   resolve(totalPay);
    // });
  }


// calculateRTP
// const totalPayOut = calculateTotalPay((err, data) => {
//     if (err) throw err;
//     console.log("Total Pay: " + data);
// })
// console.log(totalPayOut);

const totalPayOut = calculateTotalPay();
console.log(totalPayOut);