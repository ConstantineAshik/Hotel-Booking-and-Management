"use server";
import {z} from "zod";
import {revalidatePath} from "next/cache";
import {db} from "./db";
import {requireUser,assertOrigin} from "./auth";
import {digest} from "./crypto";
import {notificationTemplateSchema} from "../domain/notifications";
import type {FormState} from "../components/action-form";

export async function saveNotificationTemplate(_:FormState,form:FormData):Promise<FormState>{
 const {property,user}=await requireUser("settings.manage");
 try{await assertOrigin();const input=notificationTemplateSchema.parse({key:form.get("key"),locale:form.get("locale"),subject:form.get("subject"),body:form.get("body"),active:form.has("active")});
  await db.$transaction(async tx=>{
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${property.id}:template:${input.key}:${input.locale}`},0))`;
   const before=await tx.emailTemplate.findUnique({where:{propertyId_key_locale:{propertyId:property.id,key:input.key,locale:input.locale}}});
   const fingerprint=before?digest(JSON.stringify({subject:before.subject,content:before.content,active:before.active})):"new";
   if(form.get("fingerprint")!==fingerprint)throw new Error("CONFLICT");
   const values={subject:input.subject,content:{body:input.body},active:input.active};
   const row=await tx.emailTemplate.upsert({where:{propertyId_key_locale:{propertyId:property.id,key:input.key,locale:input.locale}},create:{...values,propertyId:property.id,key:input.key,locale:input.locale},update:values});
   await tx.auditLog.create({data:{propertyId:property.id,actorId:user.id,action:"notification.template_saved",entityType:"EmailTemplate",entityId:row.id,after:{key:input.key,locale:input.locale,active:input.active}}});
  });revalidatePath("/admin/notifications");return {success:"Email template saved."};
 }catch(error){return {error:error instanceof z.ZodError?error.issues[0].message:error instanceof Error&&error.message==="CONFLICT"?"This template changed. Reload before saving again.":"Email template could not be saved."};}
}
export async function retryNotification(_:FormState,form:FormData):Promise<FormState>{
 const {property,user}=await requireUser("settings.manage");
 try{await assertOrigin();const id=z.uuid().parse(form.get("id"));
  await db.$transaction(async tx=>{
   const changed=await tx.outboxEvent.updateMany({where:{id,propertyId:property.id,deliveredAt:null,lastErrorCode:{not:null},OR:[{lockedUntil:null},{lockedUntil:{lt:new Date()}}]},data:{attempts:0,availableAt:new Date(),lastErrorCode:null}});
   if(changed.count!==1)throw new Error("Not retryable");
   await tx.auditLog.create({data:{propertyId:property.id,actorId:user.id,action:"notification.retry_queued",entityType:"OutboxEvent",entityId:id}});
  });revalidatePath("/admin/notifications");return {success:"Retry queued. The delivery worker will process this message."};
 }catch{return {error:"This message is unavailable, already delivered, or currently being processed."};}
}
