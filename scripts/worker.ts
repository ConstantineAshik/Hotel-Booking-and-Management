import "dotenv/config";import {deliverNextNotification} from "../src/server/outbox";import {db} from "../src/server/db";
import {publishScheduledPages} from "../src/server/public-pages";
let running=true;process.on("SIGINT",()=>{running=false;});process.on("SIGTERM",()=>{running=false;});
console.log(JSON.stringify({event:"worker.started",emailConfigured:Boolean(process.env.EMAIL_API_KEY&&process.env.EMAIL_FROM)}));
while(running){try{await publishScheduledPages();const worked=await deliverNextNotification();if(process.argv.includes("--once"))break;if(!worked)await new Promise(resolve=>setTimeout(resolve,5000));}catch{console.error(JSON.stringify({event:"worker.failed"}));if(process.argv.includes("--once")){process.exitCode=1;break;}await new Promise(resolve=>setTimeout(resolve,5000));}}
await db.$disconnect();
