"use server";
import {z} from "zod";
import {revalidatePath} from "next/cache";
import {db} from "./db";
import {assertOrigin,requireUser} from "./auth";
import type {FormState} from "../components/action-form";

export async function updateInquiry(_:FormState,data:FormData):Promise<FormState>{
  const {property,user}=await requireUser("website.edit");
  try {
    await assertOrigin();
    const input=z.object({id:z.uuid(),operation:z.enum(["resolve","reopen","delete"]),confirmation:z.string().optional()}).parse(Object.fromEntries(data));
    if(input.operation==="delete"&&input.confirmation!=="DELETE")return {error:"Type DELETE to permanently remove this submission."};
    await db.$transaction(async tx=>{
      const where={id:input.id,form:{propertyId:property.id}};
      const result=input.operation==="delete"?await tx.formSubmission.deleteMany({where}):await tx.formSubmission.updateMany({where,data:{resolvedAt:input.operation==="resolve"?new Date():null}});
      if(result.count!==1)throw new Error("Unavailable submission");
      await tx.auditLog.create({data:{propertyId:property.id,actorId:user.id,action:`inquiry.${input.operation}`,entityType:"FormSubmission",entityId:input.id}});
    });
    revalidatePath("/admin/inbox");
    return {success:"Submission updated."};
  }catch{return {error:"Unable to update this submission. Please refresh and try again."};}
}
