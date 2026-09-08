import {pageMetadata} from "../server/site-metadata";
import {defaultHomePageDocument} from "../domain/cms";
import {redirect} from "next/navigation";import {db} from "../server/db";import {publicPage} from "../server/public-pages";import {HotelShell} from "../components/hotel-shell";import {CmsRenderer} from "../components/cms-renderer";
export const dynamic="force-dynamic";
export async function generateMetadata(){return pageMetadata("home");}
export default async function Home(){const property=await db.property.findFirst();if(!property)redirect("/setup");const page=await publicPage(property.id,"home",property.locale);const document=page?.document??defaultHomePageDocument(property.name,property.locale as "en"|"bn"|"ar"|"hi");return <HotelShell><main id="main"><CmsRenderer document={document} propertyId={property.id}/></main></HotelShell>;}
