"use server";
import {z} from "zod";
import {revalidatePath} from "next/cache";
import {requireUser,assertOrigin} from "./auth";
import {saveRole,saveStaff,deleteRole,StaffError} from "./staff";
import {ForbiddenError} from "../domain/permissions";
import type {FormState} from "../components/action-form";
function failure(error:unknown){return {error:error instanceof StaffError||error instanceof ForbiddenError?error.message:error instanceof z.ZodError?error.issues[0].message:"Changes could not be saved. Check for an existing email or role name."};}
export async function saveRoleAction(_:FormState,form:FormData):Promise<FormState>{
 const {principal}=await requireUser("roles.manage");try{await assertOrigin();await saveRole(principal,{id:form.get("id"),version:form.get("version"),name:form.get("name"),permissions:form.getAll("permissions")});revalidatePath("/admin","layout");return {success:"Role saved. Affected staff must sign in again."};}catch(error){return failure(error);}
}
export async function saveStaffAction(_:FormState,form:FormData):Promise<FormState>{
 const {principal}=await requireUser("users.manage");try{await assertOrigin();await saveStaff(principal,{id:form.get("id"),fingerprint:form.get("fingerprint"),name:form.get("name"),email:form.get("email"),roleId:form.get("roleId"),password:form.get("password"),disabled:form.has("disabled")},String(form.get("confirmation")??""));revalidatePath("/admin","layout");return {success:"Staff account saved."};}catch(error){return failure(error);}
}
export async function deleteRoleAction(_:FormState,form:FormData):Promise<FormState>{
 const {principal}=await requireUser("roles.manage");try{await assertOrigin();if(form.get("confirmation")!=="DELETE")return {error:"Type DELETE to confirm."};await deleteRole(principal,z.uuid().parse(form.get("id")),z.coerce.number().int().min(1).parse(form.get("version")));revalidatePath("/admin/roles");return {success:"Custom role deleted."};}catch(error){return failure(error);}
}
