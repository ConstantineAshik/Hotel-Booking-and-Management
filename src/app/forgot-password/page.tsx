import Link from "next/link";
import { ActionForm } from "../../components/action-form";
import { requestReset } from "../../server/reset-actions";
export default function ForgotPassword() {
  return <main id="main" className="auth-card"><span className="eyebrow">ACCOUNT ACCESS</span><h2>Let’s get you back in.</h2><p className="muted">Enter your account email to request a password reset.</p><ActionForm action={requestReset} label="Send reset link"><label>Email<input type="email" name="email" required /></label></ActionForm><Link href="/login" className="text-link">Back to sign in</Link></main>;
}
