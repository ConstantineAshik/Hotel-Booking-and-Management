import {z} from "zod";
import {permissions,type Principal,type Permission,ForbiddenError} from "./permissions";
export const roleInputSchema=z.object({id:z.union([z.uuid(),z.literal("")]),version:z.coerce.number().int().min(0),name:z.string().trim().min(2).max(80),permissions:z.array(z.enum(permissions)).min(1).max(permissions.length)}).strict();
export const staffInputSchema=z.object({id:z.union([z.uuid(),z.literal("")]),fingerprint:z.string().max(64),name:z.string().trim().min(2).max(100),email:z.email().max(254).transform(value=>value.toLowerCase()),roleId:z.uuid(),password:z.union([z.literal(""),z.string().min(12).max(128)]),disabled:z.boolean()}).strict().refine(input=>input.id||input.password.length>=12,"An initial password of at least 12 characters is required");
export function assertManageablePermissions(principal:Principal,grants:readonly string[]){
 if(grants.some(grant=>!principal.permissions.includes(grant as Permission)))throw new ForbiddenError();
}
