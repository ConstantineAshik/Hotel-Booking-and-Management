import {db} from "./db";import {authorize,type Principal} from "../domain/permissions";import {pageDocumentSchema,reservedSlugs,settingsSchema,settingsModules} from "../domain/cms";import type {Prisma} from "../../generated/prisma/client";
export class CmsConflict extends Error{}
async function verifyImages(tx:Prisma.TransactionClient,propertyId:string,ids:string[]){const unique=[...new Set(ids.filter(Boolean))];if(unique.length&&await tx.media.count({where:{id:{in:unique},propertyId,state:"READY"}})!==unique.length)throw new Error("Select images from this property's media library.");}
export async function savePage(principal:Principal,input:{id?:string;version:number;document:unknown;mode:"draft"|"publish";publishAt?:string}){
 authorize(principal,principal.propertyId,"website.edit");if(input.mode==="publish"||input.publishAt)authorize(principal,principal.propertyId,"website.publish");const document=pageDocumentSchema.parse(input.document);if(reservedSlugs.has(document.slug))throw new Error("This address is reserved for a hotel feature.");
 return db.$transaction(async tx=>{
  await verifyImages(tx,principal.propertyId,document.sections.flatMap(s=>[s.content.imageId,...s.content.items.map(i=>i.imageId)]));
  const before=input.id?await tx.page.findFirstOrThrow({where:{id:input.id,propertyId:principal.propertyId}}):null;
  if(before&&before.version!==input.version)throw new CmsConflict("This page changed in another session. Reload before saving.");
  const version=before?before.version+1:1;const status=input.publishAt?"SCHEDULED":input.mode==="publish"?"PUBLISHED":before?.publishedVersion?"PUBLISHED":"DRAFT";
  const data={title:document.title,slug:document.slug,locale:document.locale,seo:{title:document.seoTitle,description:document.description,noIndex:document.noIndex},version,status:status as "SCHEDULED"|"PUBLISHED"|"DRAFT",publishAt:input.publishAt?new Date(input.publishAt):null,publishedVersion:input.mode==="publish"&&!input.publishAt?version:before?.publishedVersion??null};
  let id=input.id;if(before){const result=await tx.page.updateMany({where:{id:before.id,propertyId:principal.propertyId,version:input.version},data});if(result.count!==1)throw new CmsConflict("This page changed in another session.");}else{id=(await tx.page.create({data:{...data,propertyId:principal.propertyId}})).id;}
  await tx.pageSection.deleteMany({where:{pageId:id!}});if(document.sections.length)await tx.pageSection.createMany({data:document.sections.map((s,position)=>({id:s.id,pageId:id!,type:s.type,position,visible:s.visible,startsAt:s.startsAt?new Date(s.startsAt):null,endsAt:s.endsAt?new Date(s.endsAt):null,content:s.content,style:s.style}))});
  await tx.pageRevision.create({data:{pageId:id!,version,snapshot:document,actorId:principal.userId}});
  await tx.auditLog.create({data:{propertyId:principal.propertyId,actorId:principal.userId,action:input.publishAt?"page.scheduled":input.mode==="publish"?"page.published":"page.draft_saved",entityType:"Page",entityId:id!,after:{version,title:document.title,slug:document.slug}}});
  return{id:id!,version};
 });
}
export async function saveSettings(principal:Principal,input:{namespace:string;version:number;values:unknown;mode:"draft"|"publish"}){
 const definition=settingsModules[input.namespace];if(!definition)throw new Error("Unknown settings area");authorize(principal,principal.propertyId,definition.permission);if(input.mode==="publish"&&definition.permission==="website.edit")authorize(principal,principal.propertyId,"website.publish");const values=settingsSchema(input.namespace).parse(input.values) as Prisma.InputJsonObject;
 return db.$transaction(async tx=>{
  const before=await tx.configuration.findUnique({where:{propertyId_namespace:{propertyId:principal.propertyId,namespace:input.namespace}}});if(before&&before.version!==input.version)throw new CmsConflict("These settings changed in another session. Reload before saving.");
  await verifyImages(tx,principal.propertyId,definition.fields.filter(f=>f.type==="image").map(f=>String(values[f.key]??"")));
  const version=before?before.version+1:1;let id:string;
  if(before){const updated=await tx.configuration.updateMany({where:{id:before.id,version:input.version},data:{draft:values,published:input.mode==="publish"?values:undefined,version}});if(updated.count!==1)throw new CmsConflict("Settings were changed by another editor.");id=before.id;}
  else{id=(await tx.configuration.create({data:{propertyId:principal.propertyId,namespace:input.namespace,draft:values,published:input.mode==="publish"?values:undefined,version}})).id;}
  await tx.configurationRevision.create({data:{configurationId:id,version,data:values,actorId:principal.userId}});
  await tx.auditLog.create({data:{propertyId:principal.propertyId,actorId:principal.userId,action:`settings.${input.mode}`,entityType:"Configuration",entityId:id,after:{namespace:input.namespace,version}}});return{version};
 });
}
export async function getSettings(propertyId:string,namespace:string,draft=false){
 const config=await db.configuration.findUnique({where:{propertyId_namespace:{propertyId,namespace}}});return settingsSchema(namespace).parse((draft?config?.draft:config?.published)??{}) as Record<string,string|number|boolean>;
}
