import Link from "next/link";
import {db} from "../../../../server/db";
import {requireUser} from "../../../../server/auth";
import {NavigationEditor} from "../../../../components/navigation-editor";

export default async function Navigation({searchParams}:{searchParams:Promise<{menu?:string}>}){
 const {property}=await requireUser("website.publish");
 const query=await searchParams;
 const name=query.menu==="footer"?"footer":"header";
 const [menu,pages]=await Promise.all([
  db.menu.findFirst({where:{propertyId:property.id,name,locale:property.locale},include:{items:{orderBy:{position:"asc"}}}}),
  db.page.findMany({where:{propertyId:property.id,locale:property.locale,status:{in:["DRAFT","PUBLISHED"]}},select:{id:true,title:true,slug:true,status:true},orderBy:{title:"asc"}}),
 ]);
 return <><Link className="back-link" href="/admin/website">← Website</Link><div className="page-heading"><div><span className="eyebrow">NAVIGATION</span><h1>Help guests find their way.</h1><p className="muted">Edit links, dropdowns, and their order.</p></div><div className="button-group"><Link className="button secondary" href="?menu=header">Header</Link><Link className="button secondary" href="?menu=footer">Footer</Link></div></div><section className="panel padded"><NavigationEditor key={name} name={name} pages={pages.map(page=>({id:page.id,title:page.title,slug:page.slug,status:page.status}))} initial={menu?.items.map(item=>({id:item.id,label:item.label,url:item.url,linkType:item.linkType as "internal"|"external"|"page",pageId:item.pageId,externalUrl:item.linkType==="external"?item.url:null,parentId:item.parentId,visible:item.visible,newTab:item.newTab}))??[]}/></section></>;
}
