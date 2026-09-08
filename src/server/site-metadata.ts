import {cache} from "react";
import type {Metadata} from "next";
import {db} from "./db";
import {getSettings} from "./cms";
import {publicPage} from "./public-pages";

export const siteSettings=cache(async()=>{
 const property=await db.property.findFirst();if(!property)return null;
 const [seo,theme,maintenance]=await Promise.all([getSettings(property.id,"seo"),getSettings(property.id,"theme"),getSettings(property.id,"maintenance")]);
 return {property,seo,theme,maintenance};
});
export async function siteMetadata():Promise<Metadata>{
 const site=await siteSettings();if(!site)return {title:"Hotel setup",robots:{index:false,follow:false}};
 const {property,seo,theme,maintenance}=site;const title=String(seo.title)||property.name;
 return {metadataBase:new URL(process.env.APP_URL??"http://localhost:3000"),title:{default:title,template:`%s | ${property.name}`},description:String(seo.description),keywords:String(seo.keywords),robots:{index:!seo.noIndex&&!maintenance.enabled,follow:true},icons:theme.faviconId?{icon:`/media/${theme.faviconId}`}:undefined,openGraph:{type:"website",siteName:property.name,title,description:String(seo.description),images:seo.ogImageId?[{url:`/media/${seo.ogImageId}`}]:[]},twitter:{card:"summary_large_image",title,description:String(seo.description),images:seo.ogImageId?[`/media/${seo.ogImageId}`]:[]}};
}
export async function pageMetadata(slug:string):Promise<Metadata>{
 const site=await siteSettings();if(!site)return {};
 const page=await publicPage(site.property.id,slug,site.property.locale);if(!page)return {};
 const document=page.document;const title=document.seoTitle||document.title;const description=document.description||String(site.seo.description);
 return {title,description,alternates:{canonical:slug==="home"?"/":`/${slug}`},robots:{index:!document.noIndex&&!site.seo.noIndex&&!site.maintenance.enabled,follow:true},openGraph:{title,description,images:site.seo.ogImageId?[{url:`/media/${site.seo.ogImageId}`}]:[]}};
}
