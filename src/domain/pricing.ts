import { z } from "zod";
import { stayNights } from "./stay";
export const rateRulesSchema=z.object({
  weekendPrice:z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  extraAdultPrice:z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
  childPrice:z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
  includedAdults:z.number().int().min(1).default(2),
  longStayNights:z.number().int().min(1).default(7),
  longStayPercent:z.number().min(0).max(100).default(0),
  earlyBookingDays:z.number().int().min(0).default(30),
  earlyBookingPercent:z.number().min(0).max(100).default(0),
  lastMinuteDays:z.number().int().min(0).default(2),
  lastMinutePercent:z.number().min(0).max(100).default(0),
});
export interface Override {id:string;start:string;end:string;priority:number;adjustment:string;value:string;restrictions?:{closed?:boolean;noCheckIn?:boolean;noCheckOut?:boolean;minStay?:number;maxStay?:number}}
export interface QuoteInput {checkIn:string;checkOut:string;adults:number;children:number;today:string;basePrice:string;minStay:number;maxStay:number;rules:unknown;overrides:Override[];taxes?:{name:string;kind:string;value:string;included:boolean}[];promo?:{kind:"PERCENT"|"FIXED";value:string};extras?:{id?:string;name:string;price:string;pricingType:string;quantity:number}[];rooms?:number}
export function minor(value:string):bigint {
  if(!/^\d+(\.\d{1,2})?$/.test(value))throw new Error("Invalid monetary value");
  const [whole,fraction=""]=value.split(".");return BigInt(whole)*100n+BigInt(fraction.padEnd(2,"0"));
}
export function decimal(value:bigint):string {return `${value/100n}.${(value%100n).toString().padStart(2,"0")}`;}
const roundDivide=(a:bigint,b:bigint)=>(a+b/2n)/b;
const percent=(amount:bigint,value:string)=>roundDivide(amount*minor(value),10000n);
function overrideFor(overrides:Override[],date:string){return overrides.filter(o=>o.start<=date&&date<o.end).sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id))[0];}
export function calculateQuote(input:QuoteInput){
  const dates=stayNights(input.checkIn,input.checkOut);const rules=rateRulesSchema.parse(input.rules);
  if(dates.length<input.minStay||dates.length>input.maxStay)throw new Error("This rate is not available for the selected stay length.");
  const arrival=overrideFor(input.overrides,input.checkIn);const departure=overrideFor(input.overrides,input.checkOut);
  if(arrival?.restrictions?.noCheckIn||departure?.restrictions?.noCheckOut)throw new Error("Arrival or departure is not permitted on the selected date.");
  const leadDays=(Date.parse(input.checkIn)-Date.parse(input.today))/86400000;
  const quantity=input.rooms??1;
  const nightly=dates.map(date=>{
    const override=overrideFor(input.overrides,date);const r=override?.restrictions;
    if(r?.closed||(r?.minStay&&dates.length<r.minStay)||(r?.maxStay&&dates.length>r.maxStay))throw new Error("This stay conflicts with a date restriction.");
    const weekend=[0,6].includes(new Date(date).getUTCDay());
    let amount=minor(weekend&&rules.weekendPrice?rules.weekendPrice:input.basePrice);
    if(override){if(override.adjustment==="REPLACE")amount=minor(override.value);else if(override.adjustment==="FIXED")amount+=minor(override.value);else if(override.adjustment==="PERCENT")amount+=percent(amount,override.value);else throw new Error("Invalid rate adjustment");}
    amount*=BigInt(quantity);
    amount+=minor(rules.extraAdultPrice)*BigInt(Math.max(0,input.adults-rules.includedAdults*quantity));
    amount+=minor(rules.childPrice)*BigInt(input.children);
    // One best stay discount avoids accidental stacking; explicit promo applies later.
    const discount=Math.max(dates.length>=rules.longStayNights?rules.longStayPercent:0,leadDays>=rules.earlyBookingDays?rules.earlyBookingPercent:0,leadDays<=rules.lastMinuteDays?rules.lastMinutePercent:0);
    amount-=percent(amount,discount.toFixed(2));
    return {date,amount:decimal(amount),rule:override?.id??"base",discountPercent:discount};
  });
  const roomSubtotal=nightly.reduce((sum,n)=>sum+minor(n.amount),0n);
  const extras=(input.extras??[]).map(extra=>{
    const multiplier=extra.pricingType==="PER_NIGHT"?dates.length:extra.pricingType==="PER_PERSON"?input.adults+input.children:extra.pricingType==="PER_ROOM"?quantity:1;
    return {id:extra.id,name:extra.name,quantity:extra.quantity,total:decimal(minor(extra.price)*BigInt(multiplier)*BigInt(extra.quantity))};
  });
  const subtotal=roomSubtotal+extras.reduce((sum,e)=>sum+minor(e.total),0n);
  let discount=input.promo?(input.promo.kind==="PERCENT"?percent(subtotal,input.promo.value):minor(input.promo.value)):0n;discount=discount>subtotal?subtotal:discount;
  const taxable=subtotal-discount;
  const taxRules=input.taxes??[];
  const includedFixed=taxRules.filter(t=>t.included&&t.kind==="FIXED").reduce((sum,t)=>sum+minor(t.value),0n);
  const includedPercent=taxRules.filter(t=>t.included&&t.kind==="PERCENT").reduce((sum,t)=>sum+minor(t.value),0n);
  if(includedFixed>taxable)throw new Error("Included fixed fees exceed the discounted price.");
  const taxes=taxRules.map(t=>({name:t.name,included:t.included,amount:decimal(t.kind==="FIXED"?minor(t.value):t.included?roundDivide((taxable-includedFixed)*minor(t.value),10000n+includedPercent):percent(taxable,t.value))}));
  const total=taxable+taxes.filter(t=>!t.included).reduce((sum,t)=>sum+minor(t.amount),0n);
  return {nightly,extras,roomSubtotal:decimal(roomSubtotal),subtotal:decimal(subtotal),discount:decimal(discount),taxes,total:decimal(total),nights:dates.length};
}
