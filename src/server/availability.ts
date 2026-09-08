import { z } from "zod";
import { db } from "./db";
import { staySchema,stayNights } from "../domain/stay";
import { calculateQuote, type Override } from "../domain/pricing";
import type {Prisma} from "../../generated/prisma/client";
import {bookingOptionsSchema,serviceRulesSchema,promoRulesSchema} from "../domain/booking-options";
import {minor} from "../domain/pricing";
export const bookingRulesSchema=z.object({enabled:z.boolean().default(true),maxRooms:z.number().int().min(1).max(20).default(5),maxAdults:z.number().int().min(1).max(100).default(20),maxChildren:z.number().int().min(0).max(100).default(10),minStay:z.number().int().min(1).max(365).default(1),advanceDays:z.number().int().min(1).max(730).default(365),sameDay:z.boolean().default(true),cutoffHour:z.number().int().min(0).max(23).default(18),noticeDays:z.number().int().min(0).max(365).default(0)});
export async function searchAvailability(propertyId:string, raw:unknown, client:Prisma.TransactionClient=db,rawOptions:unknown={services:[],promoCode:""},guestEmail="",existingBookingId=""){
  const stay=staySchema.parse(raw);
  const options=bookingOptionsSchema.parse(rawOptions);
  const [property,config,taxes,services,promo]=await Promise.all([client.property.findUniqueOrThrow({where:{id:propertyId}}),client.configuration.findUnique({where:{propertyId_namespace:{propertyId,namespace:"booking"}}}),client.taxRule.findMany({where:{propertyId,active:true},orderBy:{priority:"asc"}}),client.service.findMany({where:{propertyId,...(existingBookingId?{}:{active:true}),id:{in:options.services.map(service=>service.id)}}}),options.promoCode?client.promoCode.findUnique({where:{propertyId_code:{propertyId,code:options.promoCode}}}):null]);
  if(services.length!==options.services.length)throw new Error("A selected service is unavailable.");
  if(options.promoCode&&!promo)throw new Error("This promo code is unavailable.");
  const rules=bookingRulesSchema.parse(config?.published??{});
  let retainedPromo=false;
  if(promo){
    retainedPromo=Boolean(existingBookingId&&await client.promoRedemption.findUnique({where:{promoId_bookingId:{promoId:promo.id,bookingId:existingBookingId}}}));
    if(existingBookingId&&!retainedPromo)throw new Error("This promo code is unavailable.");
    const bookingFilter=existingBookingId?{not:existingBookingId}:undefined;
    const [uses,guestUses,priorBookings]=retainedPromo?[0,0,0]:await Promise.all([client.promoRedemption.count({where:{promoId:promo.id,bookingId:bookingFilter}}),guestEmail?client.promoRedemption.count({where:{promoId:promo.id,bookingId:bookingFilter,booking:{guest:{email:guestEmail.toLowerCase()}}}}):0,guestEmail?client.booking.count({where:{propertyId,id:bookingFilter,guest:{email:guestEmail.toLowerCase()}}}):0]);
    const promoRules=promoRulesSchema.parse(promo.rules);
    if(promo.usageLimit!==null&&uses>=promo.usageLimit||guestEmail&&guestUses>=promo.perGuestLimit||guestEmail&&promoRules.newCustomersOnly&&priorBookings>0)throw new Error("This promo code is unavailable.");
  }
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:property.timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const hour=Number(new Intl.DateTimeFormat("en",{timeZone:property.timezone,hour:"numeric",hourCycle:"h23"}).format(new Date()));
  const lead=(Date.parse(stay.checkIn)-Date.parse(today))/86400000;
  if(!rules.enabled||stay.rooms>rules.maxRooms||stay.adults>rules.maxAdults||stay.children>rules.maxChildren||lead<rules.noticeDays||lead>rules.advanceDays||(lead===0&&(!rules.sameDay||hour>=rules.cutoffHour)))throw new Error("These dates or guest counts are outside the hotel’s booking rules.");
  const types=await client.roomType.findMany({where:{propertyId,published:true,deletedAt:null,maxAdults:{gte:Math.ceil(stay.adults/stay.rooms)},maxChildren:{gte:Math.ceil(stay.children/stay.rooms)},maxGuests:{gte:Math.ceil((stay.adults+stay.children)/stay.rooms)}},include:{
    images:{include:{media:true},orderBy:{position:"asc"},take:1},
    units:{where:{status:"ACTIVE",nights:{none:{date:{gte:new Date(stay.checkIn),lt:new Date(stay.checkOut)}}}},orderBy:{id:"asc"}},
    ratePlans: { where: { active: true }, include: {
      policy: true,
      overrides: { where: { start: { lte: new Date(stay.checkOut) }, end: { gt: new Date(stay.checkIn) } } },
    } },
  }, orderBy: { name: "asc" } });
  return types.filter(t=>t.units.length>=stay.rooms).flatMap(room=>{
    const rates=room.ratePlans.flatMap(rate=>{try{
      const extras=options.services.map(selected=>{const service=services.find(item=>item.id===selected.id)!;const serviceRules=serviceRulesSchema.parse(service.rules);if(serviceRules.roomTypeIds.length&&!serviceRules.roomTypeIds.includes(room.id)||selected.quantity>serviceRules.maxQuantity)throw new Error("Service unavailable");return{id:service.id,name:service.name,price:service.price.toString(),pricingType:service.pricingType,quantity:selected.quantity};});
      let appliedPromo:typeof promo=null;if(promo){const now=new Date(),promoRules=promoRulesSchema.parse(promo.rules);if(!retainedPromo&&(!promo.active||promo.startsAt>now||promo.expiresAt<=now)||promoRules.minimumNights>stayNights(stay.checkIn,stay.checkOut).length||promoRules.roomTypeIds.length&&!promoRules.roomTypeIds.includes(room.id)||promoRules.ratePlanIds.length&&!promoRules.ratePlanIds.includes(rate.id))throw new Error("Promo unavailable");appliedPromo=promo;}
      const quote=calculateQuote({...stay,today,basePrice:rate.basePrice.toString(),minStay:Math.max(rate.minStay,rules.minStay),maxStay:rate.maxStay,rules:rate.rules,overrides:rate.overrides.map(o=>({...o,start:o.start.toISOString().slice(0,10),end:o.end.toISOString().slice(0,10),value:o.value.toString(),restrictions:o.restrictions as Override["restrictions"]})),taxes:taxes.map(t=>({...t,value:t.value.toString()})),extras,promo:appliedPromo?{kind:appliedPromo.kind as "PERCENT"|"FIXED",value:appliedPromo.value.toString()}:undefined});
      if(appliedPromo){const promoRules=promoRulesSchema.parse(appliedPromo.rules);if(minor(quote.subtotal)<minor(promoRules.minimumTotal))throw new Error("Promo minimum");}
      return [{id:rate.id,name:rate.name,policy:rate.policy,quote,services:extras,promo:appliedPromo?{id:appliedPromo.id,code:appliedPromo.code}:null}];
    }catch{return [];}});
    return rates.length?[{room,rates,available:room.units.length}]:[];
  });
}
