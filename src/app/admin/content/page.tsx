import Link from "next/link";
import {db} from "../../../server/db";
import {requireUser} from "../../../server/auth";
import {contentKinds,contentLabels,contentDocumentSchema} from "../../../domain/content";
import {ContentEditor} from "../../../components/content-editor";

export default async function Content({searchParams}:{searchParams:Promise<{edit?:string;kind?:string}>}){
 const {property,principal}=await requireUser("website.edit");const query=await searchParams;
 const kind=contentKinds.find(kind=>kind===query.kind);
 const [entries,media,selected]=await Promise.all([
  db.contentEntry.findMany({where:{propertyId:property.id,...(kind?{kind}:{})},orderBy:{slug:"asc"},take:200}),
  db.media.findMany({where:{propertyId:property.id,state:"READY"},select:{id:true,alt:true}}),
  query.edit?db.contentEntry.findFirst({where:{id:query.edit,propertyId:property.id}}):null
 ]);
 const selectedKind=contentKinds.find(kind=>kind===selected?.kind);
 return <><div className="page-heading"><div><span className="eyebrow">HOTEL STORIES & EXPERIENCES</span><h1>Content collections.</h1><p className="muted">Manage offers, guest stories, local recommendations, and hotel news.</p></div><Link className="button secondary" href="/admin/content">New entry</Link></div><nav className="content-tabs" aria-label="Content collections"><Link href="/admin/content" aria-current={!kind?"page":undefined}>All</Link>{contentKinds.map(value=><Link key={value} href={`?kind=${value}`} aria-current={kind===value?"page":undefined}>{contentLabels[value]}</Link>)}</nav><div className="split-layout"><section className="panel"><div className="panel-heading"><h2>{kind?contentLabels[kind]:"All entries"}</h2>{kind&&<Link href={`/collections/${kind}`} target="_blank">View collection ↗</Link>}</div>{entries.map(entry=><Link className="list-row" key={entry.id} href={`?edit=${entry.id}&kind=${entry.kind}`}><span><strong>{contentDocumentSchema.parse(entry.data).title}</strong><small>{entry.kind} · {entry.locale}</small></span><span className={`badge ${entry.status==="PUBLISHED"?"green":""}`}>{entry.status.toLowerCase()}</span></Link>)}{!entries.length&&<div className="empty-state"><h3>No entries yet.</h3><p>Create your first entry, then publish it when it is ready for guests.</p></div>}</section><section className="panel padded"><h2>{selected?"Edit entry":"Create entry"}</h2><ContentEditor key={selected?.id??"new"} initial={selected&&selectedKind?{id:selected.id,version:selected.version,kind:selectedKind,slug:selected.slug,locale:selected.locale,status:selected.status,document:contentDocumentSchema.parse(selected.data)}:undefined} media={media} canPublish={principal.permissions.includes("website.publish")}/></section></div></>;
}
