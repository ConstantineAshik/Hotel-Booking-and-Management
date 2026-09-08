import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "../../server/db";
import { currentUser } from "../../server/auth";
import { loginAction } from "../../server/auth-actions";
import { ActionForm } from "../../components/action-form";
export const dynamic = "force-dynamic";
export default async function LoginPage() {
  if (await currentUser()) redirect("/admin");
  if (!await db.property.count()) redirect("/setup");
  return <main id="main" className="auth-layout"><aside className="auth-story"><span className="eyebrow">Behind every memorable stay</span><h1>A little care.<br />A lasting impression.</h1><p>Your property, thoughtfully managed.</p><div className="arch-mark" aria-hidden="true" /></aside><section className="auth-card"><span className="eyebrow">Property management</span><h2>Welcome back.</h2><p className="muted">Sign in to get ready for your next guest.</p><ActionForm action={loginAction} label="Sign in"><label>Email address<input name="email" type="email" autoComplete="username" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label></ActionForm><Link className="text-link" href="/forgot-password">Forgot password?</Link><br /><Link className="text-link" href="/">Return to the website ↗</Link></section></main>;
}

