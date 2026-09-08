"use server";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { assertOrigin, createSession, rateLimit } from "./auth";
import { hashPassword, verifyPassword, tokenMatches, digest } from "./crypto";
import { roleTemplates, permissions } from "../domain/permissions";
import { defaultHomePageDocument } from "../domain/cms";
import type { FormState } from "../components/action-form";

const credentials = z.object({ email: z.email().transform(v => v.trim().toLowerCase()), password: z.string().min(12).max(128) });
export async function loginAction(_: FormState, data: FormData): Promise<FormState> {
  let userId: string;
  try {
    await assertOrigin();
    const input = credentials.parse(Object.fromEntries(data));
    await rateLimit(`login:${input.email}`, 8, 900);
    await rateLimit("login:global", 300, 900);
    const user = await db.user.findUnique({ where: { email: input.email } });
    const valid = await verifyPassword(input.password, user?.passwordHash ?? `scrypt:${"0".repeat(32)}:${"0".repeat(128)}`);
    if (!user || user.disabledAt || !valid) return { error: "Email or password is incorrect." };
    userId = user.id;
  } catch { return { error: "Unable to sign in. Check your details or try again later." }; }
  await createSession(userId);
  redirect("/admin");
}
export async function logoutAction() {
  await assertOrigin();
  const jar = await cookies();
  const raw = jar.get("hotel_session")?.value;
  if (raw) await db.session.deleteMany({ where: { tokenHash: digest(raw) } });
  jar.delete("hotel_session");
  redirect("/login");
}
const setupSchema = credentials.extend({
  token: z.string().min(32), name: z.string().min(2).max(100), hotelName: z.string().min(2).max(100),
  currency: z.enum(["USD", "BDT", "EUR", "GBP", "INR", "AED"]),
  timezone: z.string().refine(v => { try { Intl.DateTimeFormat("en", { timeZone: v }); return true; } catch { return false; } }),
});
export async function setupAction(_: FormState, data: FormData): Promise<FormState> {
  let userId: string;
  try {
    await assertOrigin();
    await rateLimit("setup", 10, 900);
    const input = setupSchema.parse(Object.fromEntries(data));
    if (!process.env.SETUP_TOKEN || !tokenMatches(input.token, process.env.SETUP_TOKEN)) return { error: "The setup token is invalid." };
    const passwordHash = await hashPassword(input.password);
    userId = await db.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(81423891)`;
      if (await tx.property.count()) throw new Error("Already configured");
      for (const key of permissions) await tx.permission.upsert({ where: { key }, create: { key }, update: {} });
      for (const [name, grants] of Object.entries(roleTemplates)) {
        await tx.role.create({ data: { name, system: true, permissions: { create: grants.map(permissionKey => ({ permissionKey })) } } });
      }
      const role = await tx.role.findFirstOrThrow({ where: { name: "Super Admin", system:true } });
      const property = await tx.property.create({ data: { name: input.hotelName, slug: "hotel", currency: input.currency, timezone: input.timezone } });
      const user = await tx.user.create({ data: { email: input.email, name: input.name, passwordHash, memberships: { create: { propertyId: property.id, roleId: role.id } } } });
      await tx.bookingSource.createMany({ data: ["Website", "Walk-in", "Phone", "WhatsApp", "Agent", "Other"].map(name => ({ name, propertyId: property.id })) });
      await tx.paymentMethod.create({ data: { propertyId: property.id, provider: "pay-at-hotel", enabled: true } });
      await tx.customForm.createMany({data:[{propertyId:property.id,name:"Contact",active:true,fields:[{key:"name",label:"Name",type:"text",required:true,options:[]},{key:"email",label:"Email",type:"email",required:true,options:[]},{key:"message",label:"Message",type:"textarea",required:true,options:[]}]},{propertyId:property.id,name:"Newsletter",active:true,fields:[{key:"email",label:"Email",type:"email",required:true,options:[]},{key:"consent",label:"I agree to receive hotel news and offers by email.",type:"checkbox",required:true,options:[]}]}]});
      await tx.configuration.create({ data: { propertyId: property.id, namespace: "hotel", draft: { checkIn: "14:00", checkOut: "11:00" }, published: { checkIn: "14:00", checkOut: "11:00" } } });
      const homeDocument = defaultHomePageDocument(input.hotelName, "en");
      const home = await tx.page.create({ data: { propertyId: property.id, slug: "home", locale: "en", title: homeDocument.title, status: "PUBLISHED", version: 1, publishedVersion: 1, seo: { title: homeDocument.seoTitle, description: homeDocument.description, noIndex: false } } });
      await tx.pageSection.createMany({ data: homeDocument.sections.map((section, position) => ({ id: section.id, pageId: home.id, type: section.type, position, visible: section.visible, startsAt: null, endsAt: null, content: section.content, style: section.style })) });
      await tx.pageRevision.create({ data: { pageId: home.id, version: 1, snapshot: homeDocument, actorId: user.id } });
      await tx.menu.create({ data: { propertyId: property.id, name: "header", locale: "en", items: { create: [{ label: "Home", url: "/", position: 0 }, { label: "Rooms", url: "/rooms", position: 1 }, { label: "Contact", url: "/contact", position: 2 }] } } });
      await tx.menu.create({ data: { propertyId: property.id, name: "footer", locale: "en", items: { create: [{ label: "Home", url: "/", position: 0 }, { label: "Rooms", url: "/rooms", position: 1 }, { label: "Contact", url: "/contact", position: 2 }] } } });
      await tx.auditLog.create({ data: { propertyId: property.id, actorId: user.id, action: "setup.completed", entityType: "Property", entityId: property.id } });
      return user.id;
    });
  } catch (error) { return { error: error instanceof z.ZodError ? "Please complete every field with valid details. Passwords need at least 12 characters." : "Setup could not be completed. The hotel may already be configured." }; }
  await createSession(userId);
  redirect("/admin");
}
