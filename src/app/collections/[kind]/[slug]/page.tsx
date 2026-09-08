import {cache} from "react";
import Image from "next/image";
import Link from "next/link";
import {notFound} from "next/navigation";
import {db} from "../../../../server/db";
import {getSettings} from "../../../../server/cms";
import {contentKinds,contentLabels,contentDocumentSchema,contentVisible} from "../../../../domain/content";
import {HotelShell} from "../../../../components/hotel-shell";

export const dynamic="force-dynamic";
const load=cache(async(kind:string,slug:string)=>{
 if(!contentKinds.includes(kind as typeof contentKinds[number]))return null;
 const property=await db.property.findFirst();if(!property)return null;
 const [features,entry]=await Promise.all([getSettings(property.id,"features"),db.contentEntry.findUnique({where:{propertyId_kind_slug_locale:{propertyId:property.id,kind,slug,locale:property.locale}}})]);
 if(features[kind]===false||entry?.status!=="PUBLISHED")return null;
 const parsed=contentDocumentSchema.safeParse(entry.published);return parsed.success&&contentVisible(parsed.data)?parsed.data:null;
});
export async function generateMetadata({params}:{params:Promise<{kind:string;slug:string}>}){const {kind,slug}=await params;const document=await load(kind,slug);return document?{title:document.seoTitle||document.title,description:document.description}:{};}
export default async function ContentDetail({params}:{params:Promise<{kind:string;slug:string}>}){
 const {kind,slug}=await params;const document=await load(kind,slug);if(!document)notFound();
 return <HotelShell><main id="main" className="cms-section"><article className="cms-inner content-article"><Link className="text-link" href={`/collections/${kind}`}>← {contentLabels[kind as typeof contentKinds[number]]}</Link><span className="eyebrow">{document.category}</span><h1>{document.title}</h1>{document.author&&<p>{document.author}</p>}{document.imageId&&<Image src={`/media/${document.imageId}`} alt={document.title} width={1100} height={650}/>}<p>{document.body}</p>{document.url&&<Link className="button" href={document.url}>{document.buttonLabel||"Learn more"} ↗</Link>}</article></main></HotelShell>;
}
