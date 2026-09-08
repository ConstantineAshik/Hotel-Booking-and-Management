import Link from "next/link";
import {db} from "../../../server/db";
import {requireUser} from "../../../server/auth";

export default async function Audit({searchParams}:{searchParams:Promise<{q?:string;page?:string}>}){
 const {property}=await requireUser("audit.view");const query=await searchParams;const search=(query.q??"").trim().slice(0,100);const page=Math.max(1,Math.min(10000,Math.floor(Number(query.page)||1)));
 const where={propertyId:property.id,...(search?{OR:[{action:{contains:search,mode:"insensitive" as const}},{entityType:{contains:search,mode:"insensitive" as const}},{entityId:{equals:search}}]}:{})};
 const [entries,total]=await Promise.all([db.auditLog.findMany({where,include:{actor:{select:{name:true}}},orderBy:[{createdAt:"desc"},{id:"desc"}],take:50,skip:(page-1)*50}),db.auditLog.count({where})]);
 const link=(page:number)=>`?${new URLSearchParams({q:search,page:String(page)})}`;
 return <><div className="page-heading"><div><span className="eyebrow">ACCOUNTABILITY</span><h1>Property activity.</h1><p className="muted">{total} recorded changes. Times use {property.timezone}.</p></div></div><form className="toolbar"><label>Search activity<input name="q" defaultValue={search} placeholder="Action, record type, or record ID"/></label><button className="button secondary">Search</button></form><section className="panel">{entries.map(entry=><details className="audit-entry" key={entry.id}><summary><strong>{entry.action}</strong><span>{entry.actor?.name??"System"} · {entry.createdAt.toLocaleString("en-GB",{timeZone:property.timezone})}</span></summary><p className="muted">{entry.entityType} · {entry.entityId}</p>{entry.before!==null&&<><h3>Before</h3><pre>{JSON.stringify(entry.before,null,2)}</pre></>}{entry.after!==null&&<><h3>Recorded change</h3><pre>{JSON.stringify(entry.after,null,2)}</pre></>}</details>)}{!entries.length&&<div className="empty-state"><h2>No matching activity.</h2><p>Try another action or record type.</p></div>}</section><nav className="toolbar" aria-label="Activity pages">{page>1&&<Link href={link(page-1)}>Previous</Link>}{page*50<total&&<Link href={link(page+1)}>Next</Link>}</nav></>;
}
