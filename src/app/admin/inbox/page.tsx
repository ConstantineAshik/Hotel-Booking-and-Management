import Link from "next/link";
import {db} from "../../../server/db";
import {requireUser} from "../../../server/auth";
import {updateInquiry} from "../../../server/inquiry-actions";
import {ActionForm} from "../../../components/action-form";

export default async function Inbox({searchParams}:{searchParams:Promise<{status?:string;page?:string}>}){
  const {property}=await requireUser("website.edit");
  const query=await searchParams;
  const resolved=query.status==="resolved";
  const page=Math.max(1,Math.min(10000,Number(query.page)||1));
  const where={form:{propertyId:property.id},resolvedAt:resolved?{not:null}:null};
  const [items,total]=await Promise.all([db.formSubmission.findMany({where,include:{form:true},orderBy:{createdAt:"desc"},take:25,skip:(Math.floor(page)-1)*25}),db.formSubmission.count({where})]);
  return <><div className="page-heading"><div><span className="eyebrow">GUEST INQUIRIES</span><h1>Your inbox.</h1><p className="muted">{total} {resolved?"resolved":"open"} submissions</p></div><Link className="button secondary" href="/admin/forms">Manage forms</Link></div><nav className="toolbar" aria-label="Submission status"><Link href="/admin/inbox">Open</Link><Link href="?status=resolved">Resolved</Link></nav>{items.map(item=><section className="panel padded" key={item.id}><div className="panel-heading"><h2>{item.form.name}</h2><time dateTime={item.createdAt.toISOString()}>{item.createdAt.toLocaleString("en-GB",{timeZone:property.timezone})}</time></div><dl>{Object.entries((item.data??{}) as Record<string,unknown>).map(([key,value])=><div className="list-row" key={key}><dt>{(item.form.fields as {key:string;label:string}[]).find(f=>f.key===key)?.label??key}</dt><dd style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{typeof value==="boolean"?(value?"Yes":"No"):String(value)}</dd></div>)}</dl><ActionForm action={updateInquiry} label={resolved?"Reopen":"Mark resolved"}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="operation" value={resolved?"reopen":"resolve"}/></ActionForm><details><summary>Permanently delete submission</summary><ActionForm action={updateInquiry} label="Delete submission"><input type="hidden" name="id" value={item.id}/><input type="hidden" name="operation" value="delete"/><label>Type DELETE to confirm<input name="confirmation" required pattern="DELETE"/></label></ActionForm></details></section>)}{!items.length&&<div className="panel empty-state"><h2>No {resolved?"resolved":"open"} inquiries.</h2><p>Messages submitted through your forms appear here.</p></div>}<nav className="toolbar" aria-label="Inbox pages">{page>1&&<Link href={`?status=${resolved?"resolved":"open"}&page=${page-1}`}>Previous</Link>}{page*25<total&&<Link href={`?status=${resolved?"resolved":"open"}&page=${page+1}`}>Next</Link>}</nav></>;
}
