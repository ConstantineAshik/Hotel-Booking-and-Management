import Link from "next/link";
import { ActionForm } from "../../components/action-form";
import { resetPassword } from "../../server/reset-actions";
export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <main id="main" className="auth-card"><h2>A fresh start.</h2><ActionForm action={resetPassword} label="Change password"><input type="hidden" name="token" value={token ?? ""} /><label>New password<input type="password" name="password" minLength={12} maxLength={128} autoComplete="new-password" required /></label></ActionForm><Link href="/login" className="text-link">Back to sign in</Link></main>;
}
