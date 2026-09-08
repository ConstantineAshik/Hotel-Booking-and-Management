import { cookies, headers } from "next/headers";
import { redirect, forbidden } from "next/navigation";
import { db } from "./db";
import { digest, token } from "./crypto";
import { authorize, type Permission, type Principal } from "../domain/permissions";

export async function assertOrigin() {
  const h = await headers();
  const expected = new URL(process.env.APP_URL ?? "http://localhost:3000").origin;
  if (h.get("origin") !== expected) throw new Error("Request origin is not allowed.");
}
export async function currentUser() {
  const raw = (await cookies()).get("hotel_session")?.value;
  if (!raw) return null;
  const session = await db.session.findUnique({ where: { tokenHash: digest(raw) }, include: {
    user: { include: { memberships: { include: { property: true, role: { include: { permissions: true } } } } } },
  } });
  if (!session || session.expiresAt <= new Date() || session.user.disabledAt) return null;
  const membership = session.user.memberships[0];
  if (!membership) return null;
  const principal: Principal = {
    userId: session.user.id, propertyId: membership.propertyId, disabled: false,
    permissions: membership.role.permissions.map(p => p.permissionKey as Permission),
  };
  return { principal, user: session.user, property: membership.property, role: membership.role.name };
}
export async function requireUser(permission?: Permission) {
  const auth = await currentUser();
  if (!auth) redirect("/login");
  if (permission) {
    try { authorize(auth.principal, auth.property.id, permission); }
    catch { forbidden(); }
  }
  return auth;
}
export async function createSession(userId: string) {
  const raw = token();
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
  await db.session.create({ data: { tokenHash: digest(raw), userId, expiresAt } });
  (await cookies()).set("hotel_session", raw, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt,
  });
}

/** Shared PostgreSQL limit, atomic across app instances; no IP-header trust required. */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RequestLimit" (key, count, "expiresAt") VALUES (${digest(key)}, 1, now() + ${windowSeconds} * interval '1 second')
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN "RequestLimit"."expiresAt" < now() THEN 1 ELSE "RequestLimit".count + 1 END,
      "expiresAt" = CASE WHEN "RequestLimit"."expiresAt" < now() THEN now() + ${windowSeconds} * interval '1 second' ELSE "RequestLimit"."expiresAt" END
    RETURNING count`;
  if (rows[0].count > limit) throw new Error("Too many attempts. Please try again later.");
}
