import {db} from "./db";
import {digest,hashPassword} from "./crypto";
import {authorize,validateDelegation,type Principal,type Permission} from "../domain/permissions";
import {roleInputSchema,staffInputSchema,assertManageablePermissions} from "../domain/staff";
import type {Prisma} from "../../generated/prisma/client";
export class StaffError extends Error{}
export function staffFingerprint(user:{name:string;email:string;disabledAt:Date|null;passwordHash:string},roleId:string){return digest(JSON.stringify({name:user.name,email:user.email,disabledAt:user.disabledAt,passwordHash:user.passwordHash,roleId}));}
async function lockAndAuthorize(tx:Prisma.TransactionClient,principal:Principal,permission:Permission){
 await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${principal.propertyId}:staff`},0))`;
 const member=await tx.membership.findUnique({where:{propertyId_userId:{propertyId:principal.propertyId,userId:principal.userId}},include:{user:true,role:{include:{permissions:true}}}});
 const fresh=member?{userId:principal.userId,propertyId:principal.propertyId,disabled:!!member.user.disabledAt,permissions:member.role.permissions.map(grant=>grant.permissionKey as Permission)}:null;
 authorize(fresh,principal.propertyId,permission);return fresh!;
}
export async function saveRole(principal:Principal,raw:unknown){
 const input=roleInputSchema.parse(raw);
 return db.$transaction(async tx=>{
  const actor=await lockAndAuthorize(tx,principal,"roles.manage");validateDelegation(actor,input.permissions);
  const existing=input.id?await tx.role.findFirst({where:{id:input.id,propertyId:actor.propertyId,system:false},include:{permissions:true,memberships:true}}):null;
  if(input.id&&!existing)throw new StaffError("System roles and roles outside this hotel cannot be edited.");
  if(existing){assertManageablePermissions(actor,existing.permissions.map(grant=>grant.permissionKey));if(existing.version!==input.version)throw new StaffError("This role changed. Reload before saving.");if(existing.memberships.some(member=>member.userId===actor.userId))throw new StaffError("Ask another administrator to change your own role.");}
  const grants=[...new Set(input.permissions)];
  const role=existing?await tx.role.update({where:{id:existing.id},data:{name:input.name,version:{increment:1}}}):await tx.role.create({data:{name:input.name,propertyId:actor.propertyId}});
  await tx.rolePermission.deleteMany({where:{roleId:role.id}});
  await tx.rolePermission.createMany({data:grants.map(permissionKey=>({roleId:role.id,permissionKey}))});
  if(existing?.memberships.length)await tx.session.deleteMany({where:{userId:{in:existing.memberships.map(member=>member.userId)}}});
  await tx.auditLog.create({data:{propertyId:actor.propertyId,actorId:actor.userId,action:"role.saved",entityType:"Role",entityId:role.id,after:{name:role.name,permissions:grants,version:role.version}}});
  return role;
 });
}
export async function saveStaff(principal:Principal,raw:unknown,confirmation:string){
 const input=staffInputSchema.parse(raw);const passwordHash=input.password?await hashPassword(input.password):undefined;
 return db.$transaction(async tx=>{
  const actor=await lockAndAuthorize(tx,principal,"users.manage");
  const role=await tx.role.findFirst({where:{id:input.roleId,OR:[{system:true},{propertyId:actor.propertyId}]},include:{permissions:true}});
  if(!role)throw new StaffError("Choose a role available to this hotel.");assertManageablePermissions(actor,role.permissions.map(grant=>grant.permissionKey));
  const member=input.id?await tx.membership.findUnique({where:{propertyId_userId:{propertyId:actor.propertyId,userId:input.id}},include:{user:{include:{memberships:true}},role:{include:{permissions:true}}}}):null;
  if(input.id&&!member)throw new StaffError("This staff account is unavailable.");
  if(member){
   assertManageablePermissions(actor,member.role.permissions.map(grant=>grant.permissionKey));
   if(member.user.memberships.length!==1)throw new StaffError("Accounts shared across hotels must be managed by the system operator.");
   if(input.fingerprint!==staffFingerprint(member.user,member.roleId))throw new StaffError("This account changed. Reload before saving.");
   const accessChanged=member.roleId!==role.id||!!member.user.disabledAt!==input.disabled||!!passwordHash;
   if(accessChanged&&confirmation!=="CONFIRM")throw new StaffError("Type CONFIRM to change account access or password.");
   if(member.userId===actor.userId&&(input.disabled||member.roleId!==role.id))throw new StaffError("You cannot disable yourself or change your own role.");
   if(member.role.system&&member.role.name==="Super Admin"&&!member.user.disabledAt&&(input.disabled||role.id!==member.roleId)){
    const administrators=await tx.membership.count({where:{propertyId:actor.propertyId,user:{disabledAt:null},role:{system:true,name:"Super Admin"}}});
    if(administrators<=1)throw new StaffError("Keep at least one active Super Admin.");
   }
   await tx.user.update({where:{id:member.userId},data:{name:input.name,email:input.email,passwordHash,disabledAt:input.disabled?(member.user.disabledAt??new Date()):null}});
   await tx.membership.update({where:{propertyId_userId:{propertyId:actor.propertyId,userId:member.userId}},data:{roleId:role.id}});
   if(accessChanged||input.email!==member.user.email){await tx.session.deleteMany({where:{userId:member.userId}});await tx.passwordResetToken.deleteMany({where:{userId:member.userId}});}
  }else{
   const user=await tx.user.create({data:{name:input.name,email:input.email,passwordHash:passwordHash!,disabledAt:input.disabled?new Date():null,memberships:{create:{propertyId:actor.propertyId,roleId:role.id}}}});input.id=user.id;
  }
  await tx.auditLog.create({data:{propertyId:actor.propertyId,actorId:actor.userId,action:member?"staff.updated":"staff.created",entityType:"User",entityId:input.id,after:{roleId:role.id,disabled:input.disabled,passwordChanged:!!passwordHash}}});
  return {id:input.id};
 });
}
export async function deleteRole(principal:Principal,id:string,version:number){
 return db.$transaction(async tx=>{
  const actor=await lockAndAuthorize(tx,principal,"roles.manage");
  const role=await tx.role.findFirst({where:{id,propertyId:actor.propertyId,system:false},include:{permissions:true,_count:{select:{memberships:true}}}});
  if(!role)throw new StaffError("Only custom roles belonging to this hotel can be deleted.");
  assertManageablePermissions(actor,role.permissions.map(grant=>grant.permissionKey));
  if(role.version!==version)throw new StaffError("This role changed. Reload before deleting.");
  if(role._count.memberships)throw new StaffError("Assign staff to another role before deleting this one.");
  await tx.role.delete({where:{id:role.id}});
  await tx.auditLog.create({data:{propertyId:actor.propertyId,actorId:actor.userId,action:"role.deleted",entityType:"Role",entityId:role.id,after:{name:role.name}}});
 });
}
