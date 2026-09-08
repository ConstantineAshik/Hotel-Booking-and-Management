import {pageMetadata} from "../../server/site-metadata";
import {notFound} from "next/navigation";import {db} from "../../server/db";import {publicPage} from "../../server/public-pages";import {HotelShell} from "../../components/hotel-shell";import {CmsRenderer} from "../../components/cms-renderer";import {getSettings} from "../../server/cms";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){return pageMetadata((await params).slug);}
export default async function CustomPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const property=await db.property.findFirstOrThrow();const features=await getSettings(property.id,"features");if(slug in features&&features[slug]===false)notFound();const page=await publicPage(property.id,slug,property.locale);if(!page)notFound();return <HotelShell><main id="main"><CmsRenderer document={page.document} propertyId={property.id}/></main></HotelShell>;}
