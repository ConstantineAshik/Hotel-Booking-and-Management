"use server";
import {z} from "zod";
import {revalidatePath} from "next/cache";
import {db} from "./db";
import {assertOrigin,requireUser} from "./auth";
import {digest} from "./crypto";
import {guestInputSchema,guestProfileSchema} from "../domain/guests";
import type {FormState} from "../components/action-form";

export async function saveGuest(_:FormState,form:FormData):Promise<FormState>{
 const {property,user}=await requireUser("guest.edit");
 try{await assertOrigin();const input=guestInputSchema.parse({id:form.get("id"),name:form.get("name"),email:form.get("email"),phone:form.get("phone"),notes:form.get("notes"),vip:form.has("vip"),blacklisted:form.has("blacklisted"),profile:{nationality:form.get("nationality"),address:form.get("address"),preferences:form.get("preferences")},fingerprint:form.get("fingerprint")});
  await db.$transaction(async tx=>{
   await tx.$executeRaw`SELECT id FROM "Guest" WHERE id=${input.id}::uuid AND "propertyId"=${property.id}::uuid FOR UPDATE`;
   const guest=await tx.guest.findFirstOrThrow({where:{id:input.id,propertyId:property.id,deletedAt:null}});
   const current=digest(JSON.stringify({name:guest.name,email:guest.email,phone:guest.phone,profile:guest.profile,notes:guest.notes,vip:guest.vip,blacklisted:guest.blacklisted}));
   if(current!==input.fingerprint)throw new Error("CONFLICT");
   if(guest.blacklisted!==input.blacklisted&&form.get("confirmation")!=="CONFIRM")throw new Error("CONFIRMATION");
   await tx.guest.update({where:{id:guest.id},data:{name:input.name,email:input.email,phone:input.phone||null,notes:input.notes||null,vip:input.vip,blacklisted:input.blacklisted,profile:input.profile}});
   await tx.auditLog.create({data:{propertyId:property.id,actorId:user.id,action:"guest.updated",entityType:"Guest",entityId:guest.id,after:{vip:input.vip,blacklisted:input.blacklisted,changedFields:["name","email","phone","notes","profile","vip","blacklisted"].filter(key=>JSON.stringify(guest[key as keyof typeof guest])!==JSON.stringify(input[key as keyof typeof input]))}}});
  });revalidatePath("/admin/guests","layout");return {success:"Guest profile saved."};
 }catch(error){return {error:error instanceof z.ZodError?error.issues[0].message:error instanceof Error&&error.message==="CONFLICT"?"This profile changed. Reload before saving.":error instanceof Error&&error.message==="CONFIRMATION"?"Type CONFIRM when changing the booking block.":"Guest profile could not be saved."};}
}

export async function mergeGuest(_:FormState,form:FormData):Promise<FormState>{
 const {property,user}=await requireUser("guest.edit");
 try{
  await assertOrigin();
  const input=z.object({targetId:z.uuid(),sourceId:z.uuid(),confirmation:z.literal("MERGE")}).strict().parse(Object.fromEntries(form));
  if(input.targetId===input.sourceId)throw new Error("Choose a different duplicate profile.");
  await db.$transaction(async tx=>{
   const ids=[input.targetId,input.sourceId].sort();
   await tx.$queryRaw`SELECT id FROM "Guest" WHERE "propertyId"=${property.id}::uuid AND id IN (${ids[0]}::uuid,${ids[1]}::uuid) ORDER BY id FOR UPDATE`;
   const [target,source]=await Promise.all([tx.guest.findFirst({where:{id:input.targetId,propertyId:property.id,deletedAt:null}}),tx.guest.findFirst({where:{id:input.sourceId,propertyId:property.id,deletedAt:null}})]);
   if(!target||!source)throw new Error("One of these guest profiles is no longer available.");
   const targetProfile=guestProfileSchema.parse(target.profile),sourceProfile=guestProfileSchema.parse(source.profile);
   const profile={nationality:targetProfile.nationality||sourceProfile.nationality,address:targetProfile.address||sourceProfile.address,preferences:targetProfile.preferences||sourceProfile.preferences};
   const notes=[target.notes,source.notes].filter((value,index,all)=>value&&all.indexOf(value)===index).join("\n\n").slice(0,5000);
   const moved=await tx.booking.updateMany({where:{propertyId:property.id,guestId:source.id},data:{guestId:target.id}});
   await tx.guest.update({where:{id:target.id},data:{phone:target.phone||source.phone,profile,notes:notes||null,vip:target.vip||source.vip,blacklisted:target.blacklisted||source.blacklisted}});
   await tx.guest.update({where:{id:source.id},data:{name:"Merged profile",email:`merged+${source.id}@invalid.local`,phone:null,profile:{},notes:null,vip:false,blacklisted:false,deletedAt:new Date()}});
   await tx.auditLog.create({data:{propertyId:property.id,actorId:user.id,action:"guest.merged",entityType:"Guest",entityId:target.id,before:{sourceId:source.id,targetId:target.id},after:{movedBookings:moved.count}}});
  });
  revalidatePath("/admin/guests","layout");return {success:"Guest profiles merged. All reservations now belong to this profile."};
 }catch(error){return {error:error instanceof z.ZodError?error.issues[0].message:error instanceof Error?error.message:"Guest profiles could not be merged."};}
}
