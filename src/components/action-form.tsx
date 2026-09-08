"use client";
import { useActionState, type ReactNode } from "react";
export type FormState = { error?: string; success?: string };
export function ActionForm({ action, children, label = "Save changes", className = "form" }: {
  action: (state: FormState, data: FormData) => Promise<FormState>; children: ReactNode; label?: string; className?: string;
}) {
  const [state, dispatch, pending] = useActionState(action, {});
  return <form action={dispatch} className={className}>
    {children}
    {state.error && <p className="message error" role="alert">{state.error}</p>}
    {state.success && <p className="message success" role="status">{state.success}</p>}
    <button className="button" disabled={pending}>{pending ? "Saving…" : label}</button>
  </form>;
}
