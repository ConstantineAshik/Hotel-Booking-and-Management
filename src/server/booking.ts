import {z} from "zod";
import {createHmac,randomBytes} from "node:crypto";
import {db} from "./db";
import {digest} from "./crypto";
import {staySchema,stayNights} from "../domain/stay";
import {searchAvailability} from "./availability";
import {assertBookingTransition,type BookingStatus} from "../domain/booking-state";
import type {Principal} from "../domain/permissions";
import {authorize} from "../domain/permissions";
import {minor,decimal} from "../domain/pricing";
import {localArrival,cancellationAmounts} from "../domain/cancellation";
import {bookingOptionsSchema} from "../domain/booking-options";
export const reservationSchema=z.object({
  stay:staySchema,ratePlanId:z.uuid(),name:z.string().trim().min(2).max(150),email:z.email().transform(v=>v.toLowerCase()),phone:z.string().trim().min(5).max(40),
  expectedTotal:z.string().regex(/^\d+(\.\d{1,2})?$/),idempotencyKey:z.string().regex(/^[a-f0-9-]{32,64}$/),
  sourceId:z.uuid().optional(),note:z.string().max(2000).default(""),acceptedPolicy:z.literal(true),
  paymentMethod:z.enum(["pay-at-hotel","bank-transfer","cash"]).default("pay-at-hotel"),
  options:bookingOptionsSchema.default({services:[],promoCode:""}),
});
export type ReservationInput=z.infer<typeof reservationSchema>;
export class BookingError extends Error{}
export async function reserve(propertyId:string,raw:unknown,principal?:Principal){
  const input=reservationSchema.parse(raw);if(principal)authorize(principal,propertyId,"booking.create");
  if(!process.env.SESSION_SECRET)throw new BookingError("Booking is not configured. Contact the hotel.");
  const accessToken=createHmac("sha256",process.env.SESSION_SECRET).update(`${propertyId}:${input.idempotencyKey}`).digest("hex");
  const requestHash=digest(JSON.stringify(input));
  const booking=await db.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${propertyId}),hashtext(${input.idempotencyKey}))`;
    const prior=await tx.booking.findUnique({where:{propertyId_idempotencyKey:{propertyId,idempotencyKey:input.idempotencyKey}}});
    if(prior){if(prior.requestHash!==requestHash)throw new BookingError("This request was already used for a different reservation.");return prior;}
    // All edits and allocations acquire unit locks. Deterministic lock order avoids deadlocks.
    const plan=await tx.ratePlan.findFirstOrThrow({where:{id:input.ratePlanId,propertyId,active:true}});
    await tx.$queryRaw`SELECT id FROM "RoomUnit" WHERE "propertyId"=${propertyId}::uuid AND "roomTypeId"=${plan.roomTypeId}::uuid ORDER BY id FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "RatePlan" WHERE id=${plan.id}::uuid FOR UPDATE`;
    if(input.options.promoCode)await tx.$queryRaw`SELECT id FROM "PromoCode" WHERE "propertyId"=${propertyId}::uuid AND code=${input.options.promoCode} FOR UPDATE`;
    const results=await searchAvailability(propertyId,input.stay,tx,input.options,input.email);
    const selection=results.find(r=>r.rates.some(rate=>rate.id===input.ratePlanId));const rate=selection?.rates.find(r=>r.id===input.ratePlanId);
    if(!selection||!rate)throw new BookingError("This room is no longer available. Please search again.");
    if(minor(rate.quote.total)!==minor(input.expectedTotal))throw new BookingError("The price has changed. Please review the updated quote.");
    const source=principal&&input.sourceId?await tx.bookingSource.findFirstOrThrow({where:{id:input.sourceId,propertyId,active:true}}):await tx.bookingSource.findFirstOrThrow({where:{propertyId,name:"Website",active:true}});
    const property=await tx.property.findUniqueOrThrow({where:{id:propertyId}});
    const paymentMethod=await tx.paymentMethod.findUnique({where:{propertyId_provider:{propertyId,provider:input.paymentMethod}}});
    if(!principal&&!paymentMethod?.enabled)throw new BookingError("This payment method is no longer available. Please review your reservation.");
    const blocked=await tx.guest.findFirst({where:{propertyId,email:input.email,blacklisted:true}});if(blocked)throw new BookingError("Please contact the hotel to complete your booking.");
    const guest=await tx.guest.create({data:{propertyId,name:input.name,email:input.email,phone:input.phone}});
    const row=await tx.booking.create({data:{propertyId,reference:`H-${randomBytes(6).toString("hex").toUpperCase()}`,accessTokenHash:digest(accessToken),idempotencyKey:input.idempotencyKey,requestHash,guestId:guest.id,sourceId:source.id,status:"CONFIRMED",currency:property.currency,total:rate.quote.total,pricingSnapshot:{...rate.quote,paymentMethod:input.paymentMethod,paymentInstructions:paymentMethod?.publicConfig??{},policy:{name:rate.policy.name,rules:rate.policy.rules},roomName:selection.room.name,rateName:rate.name,guest:{name:input.name,email:input.email,phone:input.phone}},events:{create:{kind:"CONFIRMED",actorId:principal?.userId,data:{source:source.name,note:input.note}}}}});
    for(const extra of rate.services){await tx.bookingService.create({data:{propertyId,bookingId:row.id,serviceId:extra.id,quantity:extra.quantity,total:rate.quote.extras.find(item=>item.id===extra.id)!.total,snapshot:{name:extra.name,price:extra.price,pricingType:extra.pricingType}}});}
    if(rate.promo&&minor(rate.quote.discount)>0n)await tx.promoRedemption.create({data:{propertyId,promoId:rate.promo.id,bookingId:row.id,amount:rate.quote.discount}});
    const units=selection.room.units.slice(0,input.stay.rooms);const dates=stayNights(input.stay.checkIn,input.stay.checkOut);
    let remainingChildren=input.stay.children;
    for(const [index,unit] of units.entries()){
      const adults=Math.floor(input.stay.adults/units.length)+(index<input.stay.adults%units.length?1:0);
      const children=Math.min(remainingChildren,selection.room.maxChildren,selection.room.maxGuests-adults);remainingChildren-=children;
      const bookingRoom=await tx.bookingRoom.create({data:{propertyId,bookingId:row.id,ratePlanId:rate.id,checkIn:new Date(input.stay.checkIn),checkOut:new Date(input.stay.checkOut),adults,children,snapshot:{roomName:selection.room.name,unitNumber:unit.number,rateName:rate.name}}});
      await tx.inventoryNight.createMany({data:dates.map(date=>({unitId:unit.id,propertyId,date:new Date(date),bookingRoomId:bookingRoom.id}))});
    }
    if(remainingChildren)throw new BookingError("These guests cannot fit in the selected rooms.");
    await tx.outboxEvent.create({data:{propertyId,kind:"booking.confirmation",dedupeKey:`confirmation:${row.id}`,payload:{bookingId:row.id}}});
    await tx.auditLog.create({data:{propertyId,actorId:principal?.userId,action:"booking.created",entityType:"Booking",entityId:row.id,after:{reference:row.reference,total:row.total.toString(),source:source.name}}});
    return row;
  },{timeout:15000,maxWait:10000});
  return {booking,accessToken};
}
export async function changeBookingStatus(principal:Principal,id:string,target:BookingStatus,note:string){
  authorize(principal,principal.propertyId,target==="CANCELLED"?"booking.cancel":target==="CHECKED_IN"||target==="CHECKED_OUT"?"booking.checkin":"booking.edit");
  return db.$transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${id}::uuid AND "propertyId"=${principal.propertyId}::uuid FOR UPDATE`;
    const booking=await tx.booking.findFirstOrThrow({where:{id,propertyId:principal.propertyId},include:{rooms:true,payments:{include:{refunds:true}}}});
    assertBookingTransition(booking.status,target);
    const property=await tx.property.findUniqueOrThrow({where:{id:principal.propertyId}});
    const today=new Intl.DateTimeFormat("en-CA",{timeZone:property.timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    if(target==="CHECKED_IN"&&booking.rooms.some(room=>room.checkIn.toISOString().slice(0,10)>today||room.checkOut.toISOString().slice(0,10)<=today))throw new BookingError("Check-in is available only during the reserved stay dates.");
    if(target==="NO_SHOW"&&booking.rooms.some(room=>room.checkIn.toISOString().slice(0,10)>today))throw new BookingError("A future arrival cannot be marked as a no-show.");
    if(target==="CHECKED_OUT"){
      const paid=booking.payments.filter(p=>p.status==="SUCCEEDED").reduce((sum,p)=>sum+minor(p.amount.toString())-p.refunds.filter(r=>r.status==="SUCCEEDED").reduce((s,r)=>s+minor(r.amount.toString()),0n),0n);
      if(paid<minor(booking.total.toString()))throw new BookingError("Settle the remaining balance before check-out.");
    }
    if(target==="CHECKED_OUT"||target==="CANCELLED"||target==="NO_SHOW")await tx.inventoryNight.deleteMany({where:{bookingRoomId:{in:booking.rooms.map(r=>r.id)}}});
    if(target==="CANCELLED"||target==="NO_SHOW"){
      const snapshot=booking.pricingSnapshot as unknown as {policy?:{rules?:{freeCancellationHours?:number;cancellationPercent?:number;noShowPercent?:number}}};
      const config=await tx.configuration.findUnique({where:{propertyId_namespace:{propertyId:principal.propertyId,namespace:"hotel"}}});const hotel=(config?.published??{}) as Record<string,string>;
      const net=booking.payments.filter(p=>p.status==="SUCCEEDED").reduce((sum,p)=>sum+minor(p.amount.toString())-p.refunds.filter(r=>r.status==="SUCCEEDED").reduce((s,r)=>s+minor(r.amount.toString()),0n),0n);
      const cancellation=cancellationAmounts({total:booking.total.toString(),paid:decimal(net),arrival:localArrival(booking.rooms[0].checkIn.toISOString().slice(0,10),hotel.checkIn??"14:00",property.timezone),now:new Date(),freeHours:snapshot.policy?.rules?.freeCancellationHours??0,latePercent:snapshot.policy?.rules?.cancellationPercent??100,noShow:target==="NO_SHOW",noShowPercent:snapshot.policy?.rules?.noShowPercent??100});
      await tx.booking.update({where:{id},data:{status:target,total:cancellation.fee,version:{increment:1},pricingSnapshot:{...booking.pricingSnapshot as object,cancellation}}});
      const invoice=await tx.invoice.findFirst({where:{bookingId:id}});
      if(invoice&&minor(cancellation.credit)>0n)await tx.invoice.create({data:{bookingId:id,propertyId:principal.propertyId,number:`CN-${booking.reference}`,snapshot:{...invoice.snapshot as object,kind:"CREDIT_NOTE",total:cancellation.credit,creditReason:`Cancellation adjustment for ${invoice.number}`}}});
    }else await tx.booking.update({where:{id},data:{status:target,version:{increment:1}}});
    await tx.bookingEvent.create({data:{bookingId:id,kind:target,actorId:principal.userId,data:{note}}});
    await tx.auditLog.create({data:{propertyId:principal.propertyId,actorId:principal.userId,action:`booking.${target.toLowerCase()}`,entityType:"Booking",entityId:id,before:{status:booking.status},after:{status:target}}});
  });
}
