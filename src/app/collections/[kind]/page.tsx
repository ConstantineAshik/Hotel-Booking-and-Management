import Image from "next/image";
import Link from "next/link";
import {notFound} from "next/navigation";
import {db} from "../../../server/db";
import {getSettings} from "../../../server/cms";
import {publishedContent} from "../../../server/content";
import {contentKinds,contentLabels} from "../../../domain/content";
import {HotelShell} from "../../../components/hotel-shell";

export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{kind:string}>}){const {kind}=await params;return {title:contentKinds.includes(kind as typeof contentKinds[number])?contentLabels[kind as typeof contentKinds[number]]:"Content"};}
export default async function Collection({params}:{params:Promise<{kind:string}>}){
 const {kind:rawKind}=await params;const kind=contentKinds.find(kind=>kind===rawKind);if(!kind)notFound();
 const property=await db.property.findFirst();if(!property)notFound();
 const [features,entries]=await Promise.all([getSettings(property.id,"features"),publishedContent(property.id,kind,property.locale)]);
 if(features[kind]===false)notFound();
 return <HotelShell><main id="main" className="cms-section"><div className="cms-inner"><div className="section-intro"><span className="eyebrow">{property.name}</span><h1>{contentLabels[kind]}</h1></div>{!entries.length?<p>There are no published entries to show.</p>:kind==="faq"?<div className="cms-faq">{entries.map(({id,document})=><details key={id}><summary>{document.title}</summary><p>{document.body}</p></details>)}</div>:<div className="cms-cards">{entries.map(({id,slug,document})=><article className="cms-card" key={id}>{document.imageId&&<Image src={`/media/${document.imageId}`} alt={document.title} width={500} height={350}/>}<small>{document.category}</small><h2><Link href={`/collections/${kind}/${slug}`}>{document.title}</Link></h2><p>{document.description||document.body.slice(0,240)}</p>{document.author&&<p>{document.author}</p>}<Link className="text-link" href={`/collections/${kind}/${slug}`}>Read more ↗</Link></article>)}</div>}</div></main></HotelShell>;
}
