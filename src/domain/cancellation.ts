import {minor,decimal} from "./pricing";
export function localArrival(date:string,time:string,timezone:string):Date{
 const [year,month,day]=date.split("-").map(Number),[hour,minute]=time.split(":").map(Number);const target=Date.UTC(year,month-1,day,hour,minute);let guess=target;
 const format=new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});
 for(let i=0;i<4;i++){const p=Object.fromEntries(format.formatToParts(new Date(guess)).map(v=>[v.type,v.value]));const represented=Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),Number(p.hour),Number(p.minute),Number(p.second));const delta=target-represented;if(delta===0)return new Date(guess);guess+=delta;}
 throw new Error("The configured arrival time falls in a daylight-saving gap.");
}
export function cancellationAmounts(input:{total:string;paid:string;arrival:Date;now:Date;freeHours:number;latePercent:number;noShow?:boolean;noShowPercent?:number}){
 const percentage=input.noShow?(input.noShowPercent??100):input.now.getTime()<=input.arrival.getTime()-input.freeHours*3600000?0:input.latePercent;
 if(!Number.isFinite(percentage)||percentage<0||percentage>100||input.freeHours<0)throw new Error("Invalid cancellation policy");
 const fee=(minor(input.total)*BigInt(Math.round(percentage*100))+5000n)/10000n;const paid=minor(input.paid);
 return {fee:decimal(fee),credit:decimal(minor(input.total)-fee),refundDue:decimal(paid>fee?paid-fee:0n),percentage};
}
