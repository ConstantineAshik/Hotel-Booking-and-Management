import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { currentUser, assertOrigin, rateLimit } from "../../../server/auth";
import { authorize } from "../../../domain/permissions";
import { db } from "../../../server/db";
import { localStorage } from "../../../server/storage";
export async function POST(request: Request) {
  const auth = await currentUser();
  if (!auth) return Response.json({ error: "Sign in to upload images." }, { status: 401 });
  try { authorize(auth.principal, auth.property.id, "media.edit"); await assertOrigin(); }
  catch { return Response.json({ error: "Upload is not permitted." }, { status: 403 }); }
  try {
    await rateLimit(`upload:${auth.user.id}`, 30, 3600);
    if (Number(request.headers.get("content-length") ?? 0) > 11 * 1024 * 1024) return Response.json({ error: "Images must be smaller than 10 MB." }, { status: 413 });
    const form = await request.formData(); const file = form.get("file");
    const alt = z.string().trim().min(3).max(300).parse(form.get("alt"));
    if (!(file instanceof File) || file.size > 10 * 1024 * 1024 || file.size === 0 || !["image/jpeg","image/png","image/webp"].includes(file.type)) throw new Error("Invalid image");
    const bytes = Buffer.from(await file.arrayBuffer());
    const decoder = sharp(bytes, { limitInputPixels: 40_000_000, failOn: "warning" });
    const metadata = await decoder.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) > 1) throw new Error("Unsupported image");
    const result = await decoder.rotate().resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer({ resolveWithObject: true });
    const key = `${randomUUID()}.webp`;
    await localStorage.put(key, result.data);
    try {
      const media = await db.$transaction(async tx => {
        const row = await tx.media.create({ data: { propertyId: auth.property.id, storageKey: key, mimeType: "image/webp", bytes: result.data.length, width: result.info.width, height: result.info.height, alt, state: "READY" } });
        await tx.auditLog.create({ data: { propertyId: auth.property.id, actorId: auth.user.id, action: "media.uploaded", entityType: "Media", entityId: row.id } });
        return row;
      });
      return Response.json({ id: media.id, url: `/media/${media.id}` });
    } catch (error) { await localStorage.delete(key); throw error; }
  } catch { return Response.json({ error: "Upload failed. Choose a JPG, PNG, or WebP under 10 MB and add a description." }, { status: 400 }); }
}
