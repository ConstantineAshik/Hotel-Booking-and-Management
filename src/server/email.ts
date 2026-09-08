/** Resend transport. Enable only after configuring a verified sender. */
export async function sendEmail(input: { to: string; subject: string; text: string; idempotencyKey: string }) {
  if (!process.env.EMAIL_API_KEY || !process.env.EMAIL_FROM) throw new Error("EMAIL_NOT_CONFIGURED");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", signal: AbortSignal.timeout(15_000),
    headers: { Authorization: `Bearer ${process.env.EMAIL_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: input.to, subject: input.subject, text: input.text }),
  });
  if (!response.ok) throw new Error("EMAIL_DELIVERY_FAILED");
}
