import type {MetadataRoute} from "next";
import {siteSettings} from "../server/site-metadata";
export const dynamic="force-dynamic";
export default async function robots():Promise<MetadataRoute.Robots>{
 const site=await siteSettings();const hidden=!site||site.seo.noIndex||site.maintenance.enabled;
 return {rules:{userAgent:"*",...(hidden?{disallow:"/"}:{allow:"/",disallow:["/admin","/api","/preview","/login","/setup","/checkout","/confirmation","/forgot-password","/reset-password"]})},...(!hidden?{sitemap:new URL("/sitemap.xml",process.env.APP_URL??"http://localhost:3000").href}:{})};
}
