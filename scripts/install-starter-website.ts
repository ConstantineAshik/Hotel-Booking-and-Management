import "dotenv/config";
import { db } from "../src/server/db";
import { installStarterWebsite } from "../src/server/starter-website";
import { defaultHomePageDocument, pageDocumentSchema } from "../src/domain/cms";
import { savePage } from "../src/server/cms";
import type { Permission } from "../src/domain/permissions";
try {
  for (const property of await db.property.findMany({ select: { id: true } })) {
    const result = await installStarterWebsite(property.id);
    console.log(result.created ? "Installed missing starter homepage." : "Preserved existing homepage.");
    if (!result.created) {
      const page = await db.page.findUniqueOrThrow({ where: { id: result.id }, include: { revisions: true, property: true } });
      if (page.version === 1 && page.publishedVersion === 1 && page.revisions.length === 1) {
        const current = pageDocumentSchema.parse(page.revisions[0].snapshot);
        const updated = defaultHomePageDocument(page.property.name, current.locale);
        const legacy = structuredClone(updated);
        legacy.sections = legacy.sections.filter(s => !["cards", "faq"].includes(s.type));
        const amenities = legacy.sections.find(s => s.type === "amenities")!;
        amenities.content.eyebrow = "THOUGHTFUL DETAILS";
        amenities.content.heading = "Everything you need, nothing you do not.";
        amenities.content.body = "From an easy arrival to a restful night, our spaces are prepared around the way you want to stay.";
        amenities.style.background = "white";
        const normalize = (document: typeof current) => JSON.stringify({ ...document, sections: document.sections.map(s => ({ ...s, id: "" })) });
        if (normalize(current) === normalize(legacy)) {
          const member = await db.membership.findFirstOrThrow({ where: { propertyId: property.id, role: { name: "Super Admin", system: true } }, include: { role: { include: { permissions: true } } } });
          await savePage({ propertyId: property.id, userId: member.userId, disabled: false, permissions: member.role.permissions.map(p => p.permissionKey as Permission) }, { id: page.id, version: page.version, document: updated, mode: "publish" });
          console.log("Upgraded untouched starter homepage; original revision retained.");
        }
      }
    }
  }
} finally { await db.$disconnect(); }
