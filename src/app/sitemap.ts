import type {MetadataRoute} from "next";
import {db} from "../server/db";
import {siteSettings} from "../server/site-metadata";
import {getSettings} from "../server/cms";
import {pageDocumentSchema} from "../domain/cms";
import {contentDocumentSchema,contentVisible} from "../domain/content";
export const dynamic="force-dynamic";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const site=await siteSettings();if(!site||site.seo.noIndex||site.maintenance.enabled)return [];
 const {property}=site;const [pages,rooms,entries,features]=await Promise.all([
  db.$queryRaw<{slug:string;snapshot:unknown}[]>`SELECT p.slug,r.snapshot FROM "Page" p JOIN "PageRevision" r ON r."pageId"=p.id AND r.version=p."publishedVersion" WHERE p."propertyId"=${property.id}::uuid AND p.locale=${property.locale}`,
  db.roomType.findMany({where:{propertyId:property.id,published:true,deletedAt:null},select:{slug:true}}),
  db.contentEntry.findMany({where:{propertyId:property.id,locale:property.locale,status:"PUBLISHED"},select:{kind:true,slug:true,published:true}}),getSettings(property.id,"features")
 ]);
 const paths=new Set(["/","/rooms","/contact"]);
 for(const page of pages){const document=pageDocumentSchema.safeParse(page.snapshot);const path=page.slug==="home"?"/":`/${page.slug}`;if(document.success&&!document.data.noIndex&&features[page.slug]!==false)paths.add(path);else paths.delete(path);}
 for(const room of rooms)paths.add(`/rooms/${room.slug}`);
 for(const entry of entries){const document=contentDocumentSchema.safeParse(entry.published);if(document.success&&contentVisible(document.data)&&features[entry.kind]!==false){paths.add(`/collections/${entry.kind}`);paths.add(`/collections/${entry.kind}/${entry.slug}`);}}
 return [...paths].map(path=>({url:new URL(path,process.env.APP_URL??"http://localhost:3000").href}));
}
