import {defaultNotificationTemplates,renderNotification,type notificationKeys} from "../domain/notifications";
import {db} from "./db";import {sendEmail} from "./email";
/** Claim one message with a recoverable lease. Run this worker separately from HTTP. */
export async function deliverNextNotification(){
 if(!process.env.EMAIL_API_KEY||!process.env.EMAIL_FROM)return false;
 const event=await db.$transaction(async tx=>{
  const rows=await tx.$queryRaw<{id:string}[]>`SELECT id FROM "OutboxEvent" WHERE "deliveredAt" IS NULL AND "availableAt"<=now() AND ("lockedUntil" IS NULL OR "lockedUntil"<now()) AND attempts<8 ORDER BY "availableAt" FOR UPDATE SKIP LOCKED LIMIT 1`;
  if(!rows.length)return null;
  return tx.outboxEvent.update({where:{id:rows[0].id},data:{lockedUntil:new Date(Date.now()+120000),attempts:{increment:1}}});
 });if(!event)return false;
 try{
  const payload=event.payload as {bookingId:string;paymentId?:string};
  const booking=await db.booking.findFirstOrThrow({where:{id:payload.bookingId,propertyId:event.propertyId},include:{guest:true,property:true,rooms:true}});
  const payment=payload.paymentId?await db.payment.findFirstOrThrow({where:{id:payload.paymentId,bookingId:booking.id}}):null;
  const template=await db.emailTemplate.findUnique({where:{propertyId_key_locale:{propertyId:event.propertyId,key:event.kind,locale:booking.property.locale}}});
  const content=(template?.content??{}) as Record<string,string>;
  const variables:Record<string,string>={guest_name:booking.guest.name,booking_id:booking.reference,hotel_name:booking.property.name,checkin_date:booking.rooms[0]?.checkIn.toISOString().slice(0,10)??"",checkout_date:booking.rooms[0]?.checkOut.toISOString().slice(0,10)??"",amount:`${booking.currency} ${payment?.amount.toString()??booking.total.toString()}`,booking_status:booking.status};
  const render=(text:string)=>renderNotification(text,variables);
  const defaults=defaultNotificationTemplates[event.kind as typeof notificationKeys[number]];
  if(template?.active!==false)await sendEmail({to:booking.guest.email,subject:render(template?.subject??defaults?.subject??`${booking.property.name} · ${booking.reference}`),text:render(content.body??defaults?.body??"Hello {{guest_name}},\n\nReservation {{booking_id}} at {{hotel_name}} is {{booking_status}}.\nArrival: {{checkin_date}}\nDeparture: {{checkout_date}}\nAmount: {{amount}}\n\nPlease contact the hotel for assistance."),idempotencyKey:event.id});
  await db.outboxEvent.update({where:{id:event.id},data:{deliveredAt:new Date(),lockedUntil:null,lastErrorCode:template?.active===false?"TEMPLATE_DISABLED":null}});
 }catch{await db.outboxEvent.update({where:{id:event.id},data:{lockedUntil:null,lastErrorCode:"DELIVERY_FAILED",availableAt:new Date(Date.now()+Math.min(3600,2**event.attempts*30)*1000)}});console.error(JSON.stringify({event:"notification.delivery_failed",id:event.id,attempt:event.attempts}));}
 return true;
}
