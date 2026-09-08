import {db} from "./db";
import {authorize,type Principal} from "../domain/permissions";
import {contentInputSchema,contentDocumentSchema,contentVisible} from "../domain/content";
import {CmsConflict} from "./cms";

export class ContentValidationError extends Error{}
export async function saveContent(principal:Principal,raw:unknown){
 authorize(principal,principal.propertyId,"website.edit");
 const input=contentInputSchema.parse(raw);
 if(input.mode!=="draft")authorize(principal,principal.propertyId,"website.publish");
 return db.$transaction(async tx=>{
  const before=input.id?await tx.contentEntry.findFirst({where:{id:input.id,propertyId:principal.propertyId}}):null;
  if(input.id&&!before)throw new ContentValidationError("This entry is unavailable.");
  if(before&&before.version!==input.version)throw new CmsConflict("This entry changed in another session. Reload before saving.");
  if(before&&(before.kind!==input.kind||before.slug!==input.slug||before.locale!==input.locale))throw new ContentValidationError("The collection, address, and language cannot change after creation. Duplicate the entry to use another address.");
  if(input.document.imageId&&!await tx.media.findFirst({where:{id:input.document.imageId,propertyId:principal.propertyId,state:"READY"},select:{id:true}}))throw new ContentValidationError("Select an image from your media library.");
  const version=(before?.version??0)+1;
  const status=input.mode==="archive"?"ARCHIVED":input.mode==="publish"?"PUBLISHED":before?.status??"DRAFT";
  const values={data:input.document,version,status,published:input.mode==="publish"?input.document:undefined} as const;
  let id=input.id;
  if(before){const updated=await tx.contentEntry.updateMany({where:{id:before.id,propertyId:principal.propertyId,version:input.version},data:values});if(updated.count!==1)throw new CmsConflict("This entry changed in another session. Reload before saving.");}
  else{id=(await tx.contentEntry.create({data:{...values,kind:input.kind,slug:input.slug,locale:input.locale,propertyId:principal.propertyId}})).id;}
  await tx.auditLog.create({data:{propertyId:principal.propertyId,actorId:principal.userId,action:`content.${input.mode}`,entityType:"ContentEntry",entityId:id!,after:{version,kind:input.kind,document:input.document}}});
  return {id:id!,version,status};
 });
}
export async function publishedContent(propertyId:string,kind:string,locale:string){
 const entries=await db.contentEntry.findMany({where:{propertyId,kind,locale,status:"PUBLISHED"},orderBy:{slug:"asc"},take:200});
 return entries.flatMap(entry=>{const parsed=contentDocumentSchema.safeParse(entry.published);return parsed.success&&contentVisible(parsed.data)?[{id:entry.id,slug:entry.slug,document:parsed.data}]:[];});
}
