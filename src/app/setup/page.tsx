import { redirect } from "next/navigation";
import { db } from "../../server/db";
import { setupAction } from "../../server/auth-actions";
import { ActionForm } from "../../components/action-form";
export const dynamic = "force-dynamic";
export default async function SetupPage() {
  if (await db.property.count()) redirect("/login");
  return <main id="main" className="auth-layout"><aside className="auth-story"><span className="eyebrow">A considered welcome</span><h1>Every great stay<br />starts here.</h1><p>One place to care for your property, your website, and the people who stay with you.</p><div className="arch-mark" aria-hidden="true" /></aside><section className="auth-card"><span className="eyebrow">Welcome to your property</span><h2>Make yourself at home.</h2><p className="muted">Create your hotel and its first administrator.</p><ActionForm action={setupAction} label="Create my hotel">
    <label>Setup token<input name="token" type="password" required autoComplete="off" /></label>
    <label>Hotel name<input name="hotelName" required maxLength={100} /></label>
    <div className="form-grid"><label>Your name<input name="name" required autoComplete="name" /></label><label>Email address<input name="email" type="email" required autoComplete="email" /></label></div>
    <label>Password<input name="password" type="password" minLength={12} maxLength={128} required autoComplete="new-password" /><small>Use at least 12 characters.</small></label>
    <div className="form-grid"><label>Currency<select name="currency"><option>BDT</option><option>USD</option><option>EUR</option><option>GBP</option><option>INR</option><option>AED</option></select></label><label>Time zone<input name="timezone" defaultValue="Asia/Dhaka" required /></label></div>
  </ActionForm></section></main>;
}
