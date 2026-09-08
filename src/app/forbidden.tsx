import Link from "next/link";
export default function Forbidden() {
  return <main id="main" className="empty-state"><span className="eyebrow">403 · ACCESS RESTRICTED</span><h1>This area needs permission.</h1><p>Ask your property administrator for access.</p><Link className="text-link" href="/admin">Return to your workspace</Link></main>;
}
