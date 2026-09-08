import { db } from "./db";
import { defaultHomePageDocument } from "../domain/cms";

/** Install only missing content. Never publish or replace an existing draft. */
export async function installStarterWebsite(propertyId: string, actorId?: string) {
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`starter:${propertyId}`}))`;
    const property = await tx.property.findUniqueOrThrow({ where: { id: propertyId } });
    const author = actorId ?? (await tx.membership.findFirstOrThrow({ where: { propertyId, role: { name: "Super Admin", system: true } }, select: { userId: true } })).userId;
    const locale = property.locale as "en" | "bn" | "ar" | "hi";
    const existing = await tx.page.findUnique({ where: { propertyId_slug_locale: { propertyId, slug: "home", locale } } });
    if (existing) return { id: existing.id, created: false };
    const document = defaultHomePageDocument(property.name, locale);
    const page = await tx.page.create({ data: { propertyId, slug: "home", locale, title: document.title, status: "PUBLISHED", version: 1, publishedVersion: 1, seo: { title: document.seoTitle, description: document.description, noIndex: false } } });
    await tx.pageSection.createMany({ data: document.sections.map((section, position) => ({ id: section.id, pageId: page.id, type: section.type, position, visible: section.visible, content: section.content, style: section.style })) });
    await tx.pageRevision.create({ data: { pageId: page.id, version: 1, snapshot: document, actorId: author } });
    for (const name of ["header", "footer"]) {
      const menu = await tx.menu.findFirst({ where: { propertyId, name, locale } });
      if (!menu) await tx.menu.create({ data: { propertyId, name, locale, items: { create: [{ label: "Home", url: "/", position: 0 }, { label: "Rooms", url: "/rooms", position: 1 }, { label: "Contact", url: "/contact", position: 2 }] } } });
    }
    await tx.auditLog.create({ data: { propertyId, actorId, action: "website.starter_installed", entityType: "Page", entityId: page.id } });
    return { id: page.id, created: true };
  });
}
