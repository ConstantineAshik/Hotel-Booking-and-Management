import Link from "next/link";
import {notFound} from "next/navigation";
import {SettingsEditor} from "../../../../../components/settings-editor";
import {settingsModules,settingsSchema} from "../../../../../domain/cms";
import {requireUser} from "../../../../../server/auth";
import {db} from "../../../../../server/db";

export default async function WebsiteSettings({params}:{params:Promise<{namespace:string}>}){
 const {namespace}=await params,definition=settingsModules[namespace];if(!definition)notFound();
 const auth=await requireUser(definition.permission);
 const [config,media]=await Promise.all([
  db.configuration.findUnique({where:{propertyId_namespace:{propertyId:auth.property.id,namespace}},include:{revisions:{orderBy:{version:"desc"},take:20}}}),
  db.media.findMany({where:{propertyId:auth.property.id,state:"READY"},select:{id:true,alt:true},take:200}),
 ]);
 const currentPublished=JSON.stringify(config?.published??null);
 return <>
  <Link className="back-link" href="/admin/website">← Website</Link>
  <div className="page-heading"><div><span className="eyebrow">WEBSITE SETTINGS</span><h1>{definition.title}.</h1><p className="muted">{definition.description}</p></div></div>
  <section className="panel padded"><SettingsEditor namespace={namespace} initial={settingsSchema(namespace).parse(config?.draft??{}) as Record<string,string|number|boolean>} initialVersion={config?.version??0} media={media} canPublish={definition.permission!=="website.edit"||auth.principal.permissions.includes("website.publish")}/></section>
  {config?.revisions.length?<section className="panel padded"><h2>Revision history</h2><p className="muted">The latest 20 immutable drafts are retained for review. Imported settings also create a revision before you publish them.</p>{config.revisions.map(revision=><details key={revision.id} className="revision-entry"><summary>Version {revision.version} · {revision.createdAt.toLocaleString("en")}{JSON.stringify(revision.data)===currentPublished?" · current published":""}</summary><pre>{JSON.stringify(revision.data,null,2)}</pre></details>)}</section>:null}
 </>;
}
