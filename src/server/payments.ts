import {z} from "zod";import {db} from "./db";import {authorize,type Principal} from "../domain/permissions";import {minor,decimal} from "../domain/pricing";import {BookingError} from "./booking";
const paymentSchema=z.object({bookingId:z.uuid(),amount:z.string().regex(/^\d+(\.\d{1,2})?$/).refine(v=>minor(v)>0n),provider:z.enum(["cash","bank-transfer","pay-at-hotel"]),reference:z.string().trim().min(3).max(120),idempotencyKey:z.uuid()});
export async function recordPayment(principal:Principal,raw:unknown){
 authorize(principal,principal.propertyId,"payments.edit");const input=paymentSchema.parse(raw);
 return db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${input.bookingId}::uuid AND "propertyId"=${principal.propertyId}::uuid FOR UPDATE`;
  const booking=await tx.booking.findFirstOrThrow({where:{id:input.bookingId,propertyId:principal.propertyId},include:{payments:{include:{refunds:true}}}});
  const existing=await tx.payment.findUnique({where:{idempotencyKey:input.idempotencyKey}});
  if(existing){if(existing.bookingId!==booking.id||minor(existing.amount.toString())!==minor(input.amount)||existing.provider!==input.provider||existing.externalId!==input.reference)throw new BookingError("This payment request was already used for different details.");return existing;}
  if(["CANCELLED","NO_SHOW"].includes(booking.status))throw new BookingError("Cannot collect payment against a cancelled or no-show booking.");
  const net=booking.payments.filter(p=>p.status==="SUCCEEDED").reduce((sum,p)=>sum+minor(p.amount.toString())-p.refunds.filter(r=>r.status==="SUCCEEDED").reduce((s,r)=>s+minor(r.amount.toString()),0n),0n);
  if(net+minor(input.amount)>minor(booking.total.toString()))throw new BookingError("Payment exceeds the remaining balance.");
  const payment=await tx.payment.create({data:{propertyId:principal.propertyId,bookingId:booking.id,provider:input.provider,externalId:input.reference,idempotencyKey:input.idempotencyKey,amount:input.amount,currency:booking.currency,status:"SUCCEEDED",verifiedBy:principal.userId}});
  await tx.bookingEvent.create({data:{bookingId:booking.id,kind:"PAYMENT_RECORDED",actorId:principal.userId,data:{amount:input.amount,method:input.provider,reference:input.reference}}});
  await tx.auditLog.create({data:{propertyId:principal.propertyId,actorId:principal.userId,action:"payment.recorded",entityType:"Payment",entityId:payment.id,after:{amount:input.amount,method:input.provider}}});
  await tx.outboxEvent.create({data:{propertyId:principal.propertyId,kind:"payment.receipt",dedupeKey:`payment:${payment.id}`,payload:{bookingId:booking.id,paymentId:payment.id}}});
  return payment;
 });
}
export async function recordRefund(principal:Principal,raw:unknown){
 authorize(principal,principal.propertyId,"payments.refund");const input=z.object({paymentId:z.uuid(),amount:z.string().regex(/^\d+(\.\d{1,2})?$/).refine(v=>minor(v)>0n),reason:z.string().trim().min(5).max(1000),reference:z.string().trim().min(3).max(120),idempotencyKey:z.uuid()}).parse(raw);
 return db.$transaction(async tx=>{
  const reference=await tx.payment.findFirstOrThrow({where:{id:input.paymentId,propertyId:principal.propertyId}});
  // Same booking-first lock order as payment collection prevents refund races.
  await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${reference.bookingId}::uuid FOR UPDATE`;
  await tx.$queryRaw`SELECT id FROM "Payment" WHERE id=${input.paymentId}::uuid FOR UPDATE`;
  const payment=await tx.payment.findFirstOrThrow({where:{id:input.paymentId,propertyId:principal.propertyId},include:{refunds:true}});
  const prior=await tx.refund.findUnique({where:{idempotencyKey:input.idempotencyKey}});
  if(prior){if(prior.paymentId!==payment.id||minor(prior.amount.toString())!==minor(input.amount)||prior.externalId!==input.reference)throw new BookingError("This refund request was already used for different details.");return prior;}
  if(payment.status!=="SUCCEEDED"||!["cash","bank-transfer","pay-at-hotel"].includes(payment.provider))throw new BookingError("Only verified offline payments can be refunded here.");
  const refunded=payment.refunds.filter(r=>r.status==="SUCCEEDED"||r.status==="PENDING").reduce((sum,r)=>sum+minor(r.amount.toString()),0n);
  if(refunded+minor(input.amount)>minor(payment.amount.toString()))throw new BookingError(`Refund exceeds the refundable amount of ${decimal(minor(payment.amount.toString())-refunded)}.`);
  const refund=await tx.refund.create({data:{paymentId:payment.id,amount:input.amount,status:"SUCCEEDED",reason:input.reason,externalId:input.reference,idempotencyKey:input.idempotencyKey}});
  await tx.bookingEvent.create({data:{bookingId:payment.bookingId,actorId:principal.userId,kind:"REFUND_RECORDED",data:{amount:input.amount,reason:input.reason,reference:input.reference}}});
  await tx.auditLog.create({data:{propertyId:principal.propertyId,actorId:principal.userId,action:"refund.recorded",entityType:"Refund",entityId:refund.id,after:{amount:input.amount,paymentId:payment.id}}});return refund;
 });
}
