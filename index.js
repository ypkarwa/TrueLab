import cluster from 'cluster';
import os from 'os';
import { config } from './config.js'
import { performance }  from 'perf_hooks';

const args = process.argv;
const noOfSim = args[2];

// var noOfSim = 10000000;
var numCPUs = os.cpus().length;
const numbersPerWorker = noOfSim/numCPUs;
let totalNumbersReceived = 0;

let totalSum = 0;
const bet = 15;
const wildSymbolId = 9;
const pic1SymbolId = 8;


if (cluster.isPrimary) 
{
    //console.log(`Master ${process.pid} is running`);
    const startTime = performance.now();
    
    const messageHandler = (msg) => {
        if (msg.type && msg.type === 'numbers') {
            totalSum += msg.sum;
            totalNumbersReceived += numbersPerWorker;
            //console.log(`Received ${numbersPerWorker} numbers from worker ${msg.workerId}`);
            
            

            if (totalNumbersReceived === numbersPerWorker * numCPUs) {
                console.log(`Total CoinOut: ${totalSum}`);
                console.log(`Total CoinIn: ${(numbersPerWorker * numCPUs * bet)}`);
                console.log(`RTP: ${totalSum / (numbersPerWorker * numCPUs * bet)}`);
                const endTime = performance.now();
                const executionTimeInSeconds = (endTime - startTime) / 1000;
                console.log(`Simulation execution time: ${executionTimeInSeconds.toFixed(3)} seconds`);
                // After calculating, we can gracefully exit all workers (optional)
                for (const id in cluster.workers) {
                    cluster.workers[id].kill();
                }
            }
        }
    };

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();

        // Listen for messages from this worker
        worker.on('message', messageHandler);
    }

    cluster.on('exit', (worker) => {
        //console.log(`Worker ${worker.process.pid} exited`);
    });


    

} 
else 
{
    
    let totalPayOfOneWorker = 0;

    for (let i = 0; i < numbersPerWorker; i++) 
    {
        if(i%(numbersPerWorker/10) === 0 && (cluster.worker.id === 1))
        {
            console.log("Progress:" + (i/(numbersPerWorker))*100 +"%");
        }
        
        
        var totalPayOfOneSpin = 0;
        const reelWindow = [];
        for (let i = 0; i < config.reels.length; i++) {
            const startPosition = Math.floor(Math.random() * config.reels[i].length);
            const visibleSymbols = [];

            for (let j = 0; j < 3; j++) 
            {
            const symbolPosition = (startPosition + j) % config.reels[i].length;
            visibleSymbols.push(config.reels[i][symbolPosition]);
            }

            reelWindow.push(visibleSymbols);
        }



        const transposedMatrix = [];
        for (let j = 0; j < 3; j++) {
            transposedMatrix[j] = [];
        }
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 3; j++) {
                transposedMatrix[j][i] = reelWindow[i][j];
            }
        }


        //console.log(transposedMatrix.map(row => row.join(' ')).join('\n'));

        let lineSymbolsToEvaluate = new Array(5);

        for (let i = 0; i < config.lines.length; i++) {
            var paylines = config.lines[i];
            
            for (let j = 0; j < 5; j++) {
                
                lineSymbolsToEvaluate[j] = reelWindow[j][paylines[j]];
            }


            totalPayOfOneSpin += getPayForLine(lineSymbolsToEvaluate);
        }
        
        totalPayOfOneWorker += totalPayOfOneSpin;
    }
    process.send({ type: 'numbers', sum: totalPayOfOneWorker, workerId: cluster.worker.id });


}



function getPayForLine(lineSymbolsToEvaluate) 
{
    
    let firstNonWildSymbol = pic1SymbolId;
    let wildOAK = 5; 
    let OAK = 0;
    let reel = 0;
    let wildOrPIC1OnlyWin = 0;
    let extendedWin = 0;

    for (reel = 0; reel < lineSymbolsToEvaluate.length; reel++) {
        if (lineSymbolsToEvaluate[reel] !== wildSymbolId) {
            firstNonWildSymbol = lineSymbolsToEvaluate[reel];
            wildOAK = reel;
            OAK = reel;
            break;
        }
    }

    wildOrPIC1OnlyWin = config.paytable[pic1SymbolId][wildOAK];


    for (; reel < lineSymbolsToEvaluate.length; reel++) {
        if (lineSymbolsToEvaluate[reel] === firstNonWildSymbol || lineSymbolsToEvaluate[reel] === wildSymbolId) {
            OAK++;
        } else {
            break;
        }
    }

    if(firstNonWildSymbol != 10)
    {
        extendedWin = config.paytable[firstNonWildSymbol][OAK];
    }
    


    let awardedComboSymbol;
    let awardedOAK;
    let awardedWin = 0;
    if (extendedWin > wildOrPIC1OnlyWin) {
        awardedComboSymbol = firstNonWildSymbol;
        awardedOAK = OAK;
        awardedWin = extendedWin;
    } 
    else {
        awardedComboSymbol = pic1SymbolId;
        awardedOAK = wildOAK;
        awardedWin = wildOrPIC1OnlyWin;
    }

    return awardedWin;
}

