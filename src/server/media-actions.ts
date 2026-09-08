"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser, assertOrigin } from "./auth";
import { db } from "./db";
import type { FormState } from "../components/action-form";

export async function editMedia(_: FormState, form: FormData): Promise<FormState> {
  const { principal } = await requireUser("media.edit");
  try {
    await assertOrigin();
    const input = z.object({id:z.uuid(),alt:z.string().trim().max(500),folder:z.string().trim().max(100),previousAlt:z.string().max(500),previousFolder:z.string().max(100)}).parse(Object.fromEntries(form));
    await db.$transaction(async tx => {
      const result = await tx.media.updateMany({where:{id:input.id,propertyId:principal.propertyId,state:"READY",alt:input.previousAlt,OR:[{folder:input.previousFolder},...(input.previousFolder===""?[{folder:null}]:[])]},data:{alt:input.alt,folder:input.folder}});
      if(result.count !== 1) throw new Error("Conflict");
      await tx.auditLog.create({data:{propertyId:principal.propertyId,actorId:principal.userId,action:"media.metadata_updated",entityType:"Media",entityId:input.id,before:{alt:input.previousAlt,folder:input.previousFolder},after:{alt:input.alt,folder:input.folder}}});
    });
    revalidatePath("/", "layout");
    return {success:"Image description and folder saved."};
  } catch { return {error:"Image could not be saved. Reload to check for another editor's changes."}; }
}
