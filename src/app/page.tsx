import {pageMetadata} from "../server/site-metadata";
import Link from "next/link";import {redirect} from "next/navigation";import {db} from "../server/db";import {publicPage} from "../server/public-pages";import {HotelShell} from "../components/hotel-shell";import {CmsRenderer} from "../components/cms-renderer";
export const dynamic="force-dynamic";
export async function generateMetadata(){return pageMetadata("home");}
export default async function Home(){const property=await db.property.findFirst();if(!property)redirect("/setup");const page=await publicPage(property.id,"home",property.locale);return <HotelShell><main id="main">{page?<CmsRenderer document={page.document} propertyId={property.id}/>:<div className="coming-soon"><span className="eyebrow">{property.name}</span><h1>A new stay<br/>is on its way.</h1><p>Our website is being prepared. Please check back soon.</p><Link className="text-link" href="/rooms">Explore available rooms ↗</Link></div>}</main></HotelShell>;}
