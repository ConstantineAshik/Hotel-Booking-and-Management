"use server";
import {z} from "zod";import {revalidatePath} from "next/cache";import {db} from "./db";import {requireUser,assertOrigin} from "./auth";import type {FormState} from "../components/action-form";
export async function issueInvoice(_:FormState,form:FormData):Promise<FormState>{
 const auth=await requireUser("payments.edit");try{await assertOrigin();const bookingId=z.uuid().parse(form.get("bookingId"));await db.$transaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "Booking" WHERE id=${bookingId}::uuid AND "propertyId"=${auth.property.id}::uuid FOR UPDATE`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${auth.property.id}),hashtext('invoice-number'))`;
  const booking=await tx.booking.findFirstOrThrow({where:{id:bookingId,propertyId:auth.property.id},include:{guest:true,rooms:true,invoices:true}});
  if(booking.invoices.length)return;
  const [config,hotel]=await Promise.all([tx.configuration.findUnique({where:{propertyId_namespace:{propertyId:auth.property.id,namespace:"invoice"}}}),tx.configuration.findUnique({where:{propertyId_namespace:{propertyId:auth.property.id,namespace:"hotel"}}})]);
  const settings=(config?.published??{}) as Record<string,string>;const count=await tx.invoice.count({where:{propertyId:auth.property.id}});const number=`${settings.prefix??"INV"}-${String(count+1).padStart(6,"0")}`;
  const invoice=await tx.invoice.create({data:{bookingId,propertyId:auth.property.id,number,snapshot:{hotel:{name:auth.property.name,...hotel?.published as object},guest:{name:booking.guest.name,email:booking.guest.email},bookingReference:booking.reference,currency:booking.currency,total:booking.total.toString(),pricing:booking.pricingSnapshot,stay:booking.rooms.map(r=>({checkIn:r.checkIn.toISOString().slice(0,10),checkOut:r.checkOut.toISOString().slice(0,10),room:r.snapshot})),footer:settings.footer??"",taxInformation:settings.taxInformation??""}}});
  await tx.auditLog.create({data:{propertyId:auth.property.id,actorId:auth.user.id,action:"invoice.issued",entityType:"Invoice",entityId:invoice.id}});
 });revalidatePath("/admin","layout");return{success:"Invoice issued. Open it from this reservation to print."};}catch{return{error:"Invoice could not be issued."};}
}
