import {z} from "zod";
import type {Prisma} from "../../generated/prisma/client";
import {settingsModules,settingsSchema} from "../domain/cms";
import {authorize,type Principal} from "../domain/permissions";
import {db} from "./db";

const bundleSchema=z.object({
  format:z.literal("hotel-booking-settings"),
  version:z.literal(1),
  exportedAt:z.string().datetime().optional(),
  namespaces:z.array(z.object({namespace:z.string().min(1).max(50),values:z.unknown()}).strict()).min(1).max(30),
}).strict().refine(bundle=>new Set(bundle.namespaces.map(row=>row.namespace)).size===bundle.namespaces.length,"Settings areas must be unique.");

export async function exportConfiguration(principal:Principal){
  authorize(principal,principal.propertyId,"settings.manage");
  const allowed=Object.entries(settingsModules).filter(([,definition])=>principal.permissions.includes(definition.permission)).map(([namespace])=>namespace);
  const rows=await db.configuration.findMany({where:{propertyId:principal.propertyId,namespace:{in:allowed}},orderBy:{namespace:"asc"}});
  return {format:"hotel-booking-settings" as const,version:1 as const,exportedAt:new Date().toISOString(),namespaces:allowed.map(namespace=>({namespace,values:settingsSchema(namespace).parse(rows.find(row=>row.namespace===namespace)?.draft??{})}))};
}

export async function importConfiguration(principal:Principal,raw:unknown){
  authorize(principal,principal.propertyId,"settings.manage");
  const bundle=bundleSchema.parse(raw);
  const parsed=bundle.namespaces.map(row=>{
    const definition=settingsModules[row.namespace];if(!definition)throw new Error(`Unknown settings area: ${row.namespace}`);
    authorize(principal,principal.propertyId,definition.permission);
    const values=settingsSchema(row.namespace).parse(row.values) as Prisma.InputJsonObject;
    const imageIds=definition.fields.filter(field=>field.type==="image").map(field=>String(values[field.key]??"")).filter(Boolean);
    return {namespace:row.namespace,values,imageIds};
  });
  return db.$transaction(async tx=>{
    const imageIds=[...new Set(parsed.flatMap(item=>item.imageIds))];
    if(imageIds.length&&await tx.media.count({where:{propertyId:principal.propertyId,state:"READY",id:{in:imageIds}}})!==imageIds.length)throw new Error("Imported settings reference images that are not in this property's media library.");
    for(const item of parsed){
      const before=await tx.configuration.findUnique({where:{propertyId_namespace:{propertyId:principal.propertyId,namespace:item.namespace}}});
      const version=(before?.version??0)+1;
      const row=before?await tx.configuration.update({where:{id:before.id},data:{draft:item.values,version}}):await tx.configuration.create({data:{propertyId:principal.propertyId,namespace:item.namespace,draft:item.values,version}});
      await tx.configurationRevision.create({data:{configurationId:row.id,version,data:item.values,actorId:principal.userId}});
    }
    await tx.auditLog.create({data:{propertyId:principal.propertyId,actorId:principal.userId,action:"settings.imported",entityType:"Configuration",entityId:principal.propertyId,after:{namespaces:parsed.map(item=>item.namespace)}}});
    return {imported:parsed.length};
  });
}
