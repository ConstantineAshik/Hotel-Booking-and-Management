"use server";
import { z } from "zod";
import { db } from "./db";
import { assertOrigin, rateLimit } from "./auth";
import { token, digest, hashPassword } from "./crypto";
import { sendEmail } from "./email";
import type { FormState } from "../components/action-form";
export async function requestReset(_: FormState, form: FormData): Promise<FormState> {
  try {
    await assertOrigin();
    const email = z.email().parse(form.get("email")).trim().toLowerCase();
    await rateLimit(`reset:${email}`, 3, 3600);
    await rateLimit("reset:global", 50, 3600);
    const user = await db.user.findUnique({ where: { email } });
    if (user && !user.disabledAt) {
      const raw = token();
      const record = await db.passwordResetToken.create({ data: { userId: user.id, tokenHash: digest(raw), expiresAt: new Date(Date.now() + 30 * 60_000) } });
      await sendEmail({ to: email, subject: "Reset your hotel workspace password", text: `Reset your password within 30 minutes: ${process.env.APP_URL}/reset-password?token=${raw}`, idempotencyKey: record.id });
    }
  } catch { /* Generic response prevents account enumeration, including delivery errors. */ }
  return { success: "If an active account matches, a reset link will be sent to its email address." };
}
export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  try {
    await assertOrigin();
    await rateLimit("reset:redeem", 100, 900);
    const input = z.object({ token: z.string().length(64), password: z.string().min(12).max(128) }).parse(Object.fromEntries(form));
    const passwordHash = await hashPassword(input.password);
    await db.$transaction(async tx => {
      const result = await tx.passwordResetToken.updateMany({ where: { tokenHash: digest(input.token), usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
      if (result.count !== 1) throw new Error("Invalid token");
      const record = await tx.passwordResetToken.findUniqueOrThrow({ where: { tokenHash: digest(input.token) } });
      await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
      await tx.session.deleteMany({ where: { userId: record.userId } });
      await tx.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: new Date() } });
    });
    return { success: "Password changed. You can now sign in with your new password." };
  } catch { return { error: "This link is invalid or expired, or your password is shorter than 12 characters." }; }
}
