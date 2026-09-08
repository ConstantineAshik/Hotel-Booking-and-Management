import Link from "next/link";
import {ActionForm} from "../../../components/action-form";
import {installStarterAction} from "../../../server/starter-actions";
import {ConfigurationTransfer} from "../../../components/configuration-transfer";
import {settingsModules} from "../../../domain/cms";
import {requireUser} from "../../../server/auth";
import {db} from "../../../server/db";

export default async function Website(){
 const {property,principal}=await requireUser("website.edit");
 const pages=await db.page.findMany({where:{propertyId:property.id},orderBy:{title:"asc"}});
 return <>
  {!pages.some(page=>page.slug==="home"&&page.locale===property.locale)&&principal.permissions.includes("website.publish")&&<section className="panel padded"><h2>Start with a complete homepage.</h2><p className="muted">Publish a ready-made welcome, room search, stay-planning cards, FAQs, contact section, and newsletter. Then edit every section in the page builder.</p><ActionForm action={installStarterAction} label="Install starter homepage"><p>Existing pages and navigation are preserved.</p></ActionForm></section>}
  <div className="page-heading"><div><span className="eyebrow">YOUR HOTEL, ONLINE</span><h1>Make it your own.</h1><p className="muted">Shape your website, tell your story, and publish when you’re ready.</p></div><Link className="button" href="/admin/website/pages/new">+ Create page</Link></div>
  <section className="panel"><div className="panel-heading"><h2>Website pages</h2><Link className="row-link" href="/" target="_blank">View website ↗</Link></div>{pages.map(page=><Link className="list-row" key={page.id} href={`/admin/website/pages/${page.id}`}><span><strong>{page.title}</strong><small>{page.slug==="home"?"/":`/${page.slug}`} · {page.locale}</small></span><span className={`badge ${page.publishedVersion?"green":""}`}>{page.status.toLowerCase()} · v{page.version}</span></Link>)}{!pages.length?<div className="empty-state"><h3>Your story starts with a page.</h3><p>Create a page with the address “home” to build your homepage.</p><Link className="text-link" href="/admin/website/pages/new">Create your first page</Link></div>:null}</section>
  <div className="settings-grid">{Object.entries(settingsModules).filter(([,module])=>principal.permissions.includes(module.permission)).map(([key,module])=><Link key={key} className="panel padded settings-card" href={`/admin/website/settings/${key}`}><h2>{module.title} ↗</h2><p className="muted">{module.description}</p></Link>)}<Link className="panel padded settings-card" href="/admin/website/navigation"><h2>Navigation ↗</h2><p className="muted">Header and footer links, dropdowns, and their order.</p></Link></div>
  {principal.permissions.includes("settings.manage")?<ConfigurationTransfer/>:null}
 </>;
}
