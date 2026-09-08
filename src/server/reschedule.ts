import {z} from "zod";
import {db} from "./db";
import {searchAvailability} from "./availability";
import {BookingError} from "./booking";
import {authorize,type Principal} from "../domain/permissions";
import {staySchema,stayNights} from "../domain/stay";
import {minor} from "../domain/pricing";
const schema=z.object({id:z.uuid(),version:z.number().int().min(1),stay:staySchema,ratePlanId:z.uuid(),expectedTotal:z.string().regex(/^\d+(\.\d{1,2})?$/),preferredUnitId:z.union([z.literal(""),z.uuid()]).default(""),note:z.string().max(2000).default("")});
export async function reschedule(principal:Principal,raw:unknown){
 authorize(principal,principal.propertyId,"booking.edit");const input=schema.parse(raw);
 return db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${input.id}::uuid AND "propertyId"=${principal.propertyId}::uuid FOR UPDATE`;
  const before=await tx.booking.findFirstOrThrow({where:{id:input.id,propertyId:principal.propertyId},include:{rooms:true,guest:true,extras:true,redemptions:{include:{promo:true}}}});
  if(before.version!==input.version)throw new BookingError("This booking changed in another session. Reload before editing.");
  if(!["CONFIRMED","PENDING"].includes(before.status))throw new BookingError("Only upcoming reservations can be rescheduled.");
  if(before.redemptions.length>1)throw new BookingError("This booking has multiple promotions and needs manual review before rescheduling.");
  // Lock the property's units in stable order before releasing any original nights.
  await tx.$queryRaw`SELECT id FROM "RoomUnit" WHERE "propertyId"=${principal.propertyId}::uuid ORDER BY id FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM "RatePlan" WHERE id=${input.ratePlanId}::uuid FOR UPDATE`;
  if(before.redemptions[0])await tx.$queryRaw`SELECT id FROM "PromoCode" WHERE id=${before.redemptions[0].promoId}::uuid FOR UPDATE`;
  await tx.inventoryNight.deleteMany({where:{bookingRoomId:{in:before.rooms.map(r=>r.id)}}});
  const options={services:before.extras.map(extra=>({id:extra.serviceId,quantity:extra.quantity})),promoCode:before.redemptions[0]?.promo.code??""};
  const results=await searchAvailability(principal.propertyId,input.stay,tx,options,before.guest.email,before.id);const selection=results.find(r=>r.rates.some(rate=>rate.id===input.ratePlanId));const rate=selection?.rates.find(r=>r.id===input.ratePlanId);
  if(!selection||!rate)throw new BookingError("The requested room is unavailable. Your original reservation is unchanged.");
  if(minor(input.expectedTotal)!==minor(rate.quote.total))throw new BookingError(`The updated stay costs ${before.currency} ${rate.quote.total}. Review this amount and enter it to confirm.`);
  const units=[...selection.room.units];if(input.preferredUnitId){const index=units.findIndex(u=>u.id===input.preferredUnitId);if(index<0)throw new BookingError("The selected physical room is unavailable for this stay.");units.unshift(...units.splice(index,1));}
  const chosen=units.slice(0,input.stay.rooms);let childrenLeft=input.stay.children;
  await tx.bookingRoom.deleteMany({where:{bookingId:before.id}});
  for(const [index,unit]of chosen.entries()){
   const adults=Math.floor(input.stay.adults/chosen.length)+(index<input.stay.adults%chosen.length?1:0),children=Math.min(childrenLeft,selection.room.maxChildren,selection.room.maxGuests-adults);childrenLeft-=children;
   const room=await tx.bookingRoom.create({data:{propertyId:principal.propertyId,bookingId:before.id,ratePlanId:rate.id,checkIn:new Date(input.stay.checkIn),checkOut:new Date(input.stay.checkOut),adults,children,snapshot:{roomName:selection.room.name,unitNumber:unit.number,rateName:rate.name}}});
   await tx.inventoryNight.createMany({data:stayNights(input.stay.checkIn,input.stay.checkOut).map(date=>({propertyId:principal.propertyId,unitId:unit.id,date:new Date(date),bookingRoomId:room.id}))});
  }
  if(childrenLeft)throw new BookingError("The guest counts exceed room capacity.");
  for(const extra of rate.services){const quoted=rate.quote.extras.find(item=>item.id===extra.id)!;await tx.bookingService.updateMany({where:{bookingId:before.id,serviceId:extra.id},data:{total:quoted.total,snapshot:{name:extra.name,price:extra.price,pricingType:extra.pricingType}}});}
  if(rate.promo)await tx.promoRedemption.updateMany({where:{bookingId:before.id,promoId:rate.promo.id},data:{amount:rate.quote.discount}});
  const previousSnapshot=before.pricingSnapshot as Record<string,never>;
  await tx.booking.update({where:{id:before.id},data:{total:rate.quote.total,version:{increment:1},pricingSnapshot:{...previousSnapshot,...rate.quote,policy:{name:rate.policy.name,rules:rate.policy.rules},roomName:selection.room.name,rateName:rate.name}}});
  await tx.bookingEvent.create({data:{bookingId:before.id,actorId:principal.userId,kind:"RESCHEDULED",data:{note:input.note,previousTotal:before.total.toString(),newTotal:rate.quote.total,previousStay:before.rooms.map(r=>({checkIn:r.checkIn.toISOString(),checkOut:r.checkOut.toISOString(),snapshot:r.snapshot}))}}});
  await tx.auditLog.create({data:{propertyId:principal.propertyId,actorId:principal.userId,action:"booking.rescheduled",entityType:"Booking",entityId:before.id,before:{total:before.total.toString()},after:{total:rate.quote.total,stay:input.stay}}});
 },{timeout:15000,maxWait:10000});
}
