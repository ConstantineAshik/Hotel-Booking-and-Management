import Link from "next/link";
import { requireUser } from "../../server/auth";
import { logoutAction } from "../../server/auth-actions";
import { AdminNav } from "../../components/admin-nav";
export const dynamic = "force-dynamic";
export const metadata={robots:{index:false,follow:false}};
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireUser();
  return <div className="admin-layout"><aside className="sidebar"><Link className="brand" href="/admin"><span className="brand-symbol">⌂</span><span>{auth.property.name}<small>PROPERTY MANAGEMENT</small></span></Link><div className="sidebar-section">WORKSPACE</div><AdminNav permissions={auth.principal.permissions} /><div className="sidebar-bottom"><Link href="/">View website ↗</Link><div className="user-chip"><span className="avatar">{auth.user.name.slice(0,1)}</span><span>{auth.user.name}<small>{auth.role}</small></span></div><form action={logoutAction}><button className="plain-button">Sign out</button></form></div></aside><div className="admin-main"><header className="admin-header"><span>Property workspace</span><span className="header-meta">{auth.property.currency} <span className="dot" /> {auth.property.timezone}</span></header><main id="main" className="workspace">{children}</main><footer className="admin-footer">A little more time for hospitality.</footer></div></div>;
}

