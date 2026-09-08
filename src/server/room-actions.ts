"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { assertOrigin, requireUser } from "./auth";
import { roomSchema, unitSchema, hotelSchema } from "../domain/rooms";
import type { FormState } from "../components/action-form";
import type { Prisma } from "../../generated/prisma/client";

function failure(error: unknown): FormState {
  return { error: error instanceof z.ZodError ? error.issues[0].message : "Changes could not be saved. Check for duplicate names or records already in use." };
}
export async function saveRoom(_: FormState, form: FormData): Promise<FormState> {
  const auth = await requireUser("rooms.edit");
  try {
    await assertOrigin();
    const input = roomSchema.parse({ ...Object.fromEntries(form), published: form.has("published"), featured: form.has("featured"),
      attributes: { ...Object.fromEntries(form), smoking: form.has("smoking"), accessible: form.has("accessible"), breakfast: form.has("breakfast") } });
    const id = z.union([z.literal(""), z.uuid()]).parse(form.get("id") ?? "");
    const amenityIds = z.array(z.uuid()).max(100).parse(form.getAll("amenities"));
    const mediaId = z.union([z.literal(""), z.uuid()]).parse(form.get("mediaId") ?? "");
    await db.$transaction(async tx => {
      const before = id ? await tx.roomType.findFirstOrThrow({ where: { id, propertyId: auth.property.id, deletedAt: null } }) : null;
      const row = id ? await tx.roomType.update({ where: { id }, data: input }) : await tx.roomType.create({ data: { ...input, propertyId: auth.property.id } });
      await tx.roomAmenity.deleteMany({ where: { roomTypeId: row.id } });
      await tx.roomAmenity.createMany({ data: amenityIds.map(amenityId => ({ amenityId, roomTypeId: row.id, propertyId: auth.property.id })) });
      if (mediaId) {
        await tx.media.findFirstOrThrow({ where: { id: mediaId, propertyId: auth.property.id, state: "READY" } });
        await tx.roomImage.deleteMany({ where: { roomTypeId: row.id, position: 0 } });
        await tx.roomImage.upsert({ where: { roomTypeId_mediaId: { roomTypeId: row.id, mediaId } }, create: { roomTypeId: row.id, mediaId, propertyId: auth.property.id, position: 0 }, update: { position: 0 } });
      } else if (form.has("mediaId")) {
        await tx.roomImage.deleteMany({ where: { roomTypeId: row.id, position: 0 } });
      }
      await tx.auditLog.create({ data: { propertyId: auth.property.id, actorId: auth.user.id, action: id ? "room.updated" : "room.created", entityType: "RoomType", entityId: row.id, before: before ? JSON.parse(JSON.stringify(before)) : undefined, after: input } });
    });
    revalidatePath("/admin/rooms"); revalidatePath("/rooms");
    return { success: id ? "Room saved." : "Room created. Add physical rooms to make inventory available." };
  } catch (error) { return failure(error); }
}
export async function archiveRoom(_: FormState, form: FormData): Promise<FormState> {
  const auth = await requireUser("rooms.edit");
  try {
    await assertOrigin();
    if (form.get("confirmation") !== "ARCHIVE") return { error: "Type ARCHIVE to confirm." };
    const id = z.uuid().parse(form.get("id"));
    await db.$transaction(async tx => {
      const before = await tx.roomType.findFirstOrThrow({ where: { id, propertyId: auth.property.id } });
      await tx.roomType.update({ where: { id }, data: { deletedAt: new Date(), published: false } });
      await tx.auditLog.create({ data: { propertyId: auth.property.id, actorId: auth.user.id, action: "room.archived", entityType: "RoomType", entityId: before.id } });
    });
    revalidatePath("/admin/rooms"); revalidatePath("/rooms");
    return { success: "Room archived. Existing reservations are preserved." };
  } catch (error) { return failure(error); }
}
export async function duplicateRoom(_: FormState, form: FormData): Promise<FormState> {
  const auth = await requireUser("rooms.edit");
  try {
    await assertOrigin();
    const id = z.uuid().parse(form.get("id"));
    await db.$transaction(async tx => {
      const row = await tx.roomType.findFirstOrThrow({ where: { id, propertyId: auth.property.id, deletedAt: null }, include: { amenities: true, images: true } });
      const { id: oldId, amenities, images, ...data } = row;
      const copy = await tx.roomType.create({ data: { ...data, name: `${row.name} (copy)`, slug: `${row.slug}-${crypto.randomUUID().slice(0,8)}`, published: false, attributes: data.attributes as Prisma.InputJsonValue, seo: data.seo as Prisma.InputJsonValue,
        amenities: { create: amenities.map(a => ({ propertyId: auth.property.id, amenityId: a.amenityId })) },
        images: { create: images.map(i => ({ propertyId: auth.property.id, mediaId: i.mediaId, position: i.position })) },
      } });
      await tx.auditLog.create({ data: { propertyId: auth.property.id, actorId: auth.user.id, action: "room.duplicated", entityType: "RoomType", entityId: copy.id, before: { sourceId: oldId } } });
    });
    revalidatePath("/admin/rooms"); return { success: "A draft copy was created without physical room inventory." };
  } catch (error) { return failure(error); }
}
export async function saveUnit(_: FormState, form: FormData): Promise<FormState> {
  const auth = await requireUser("rooms.edit");
  try {
    await assertOrigin();
    const input = unitSchema.parse(Object.fromEntries(form));
    const id = z.union([z.literal(""), z.uuid()]).parse(form.get("id") ?? "");
    await db.$transaction(async tx => {
      await tx.roomType.findFirstOrThrow({ where: { id: input.roomTypeId, propertyId: auth.property.id, deletedAt: null } });
      if (id) {
        await tx.$queryRaw`SELECT id FROM "RoomUnit" WHERE id=${id}::uuid AND "propertyId"=${auth.property.id}::uuid FOR UPDATE`;
        const before = await tx.roomUnit.findFirstOrThrow({ where: { id, propertyId: auth.property.id } });
        if ((before.roomTypeId !== input.roomTypeId || input.status !== "ACTIVE") && await tx.inventoryNight.count({ where: { unitId: id } })) throw new Error("Allocated room");
      }
      const row = id ? await tx.roomUnit.update({ where: { id }, data: input }) : await tx.roomUnit.create({ data: { ...input, propertyId: auth.property.id } });
      await tx.auditLog.create({ data: { propertyId: auth.property.id, actorId: auth.user.id, action: "unit.saved", entityType: "RoomUnit", entityId: row.id, after: input } });
    });
    revalidatePath("/admin/units"); return { success: "Physical room saved." };
  } catch (error) { return failure(error); }
}
export async function saveAmenity(_: FormState, form: FormData): Promise<FormState> {
  const auth = await requireUser("rooms.edit");
  try {
    await assertOrigin();
    const input = z.object({ name: z.string().min(2).max(100), description: z.string().max(500), category: z.string().max(100), icon: z.enum(["wifi", "coffee", "waves", "car", "wind", "tv", "check"]) }).parse(Object.fromEntries(form));
    const id = z.union([z.literal(""), z.uuid()]).parse(form.get("id") ?? "");
    await db.$transaction(async tx => {
      if (id) await tx.amenity.findFirstOrThrow({ where: { id, propertyId: auth.property.id } });
      const row = id ? await tx.amenity.update({ where: { id }, data: { ...input, active: form.has("active") } }) : await tx.amenity.create({ data: { ...input, propertyId: auth.property.id, active: form.has("active") } });
      await tx.auditLog.create({ data: { propertyId: auth.property.id, actorId: auth.user.id, action: "amenity.saved", entityType: "Amenity", entityId: row.id, after: input } });
    });
    revalidatePath("/admin/amenities"); return { success: "Amenity saved." };
  } catch (error) { return failure(error); }
}
export async function saveHotel(_: FormState, form: FormData): Promise<FormState> {
  const auth = await requireUser("settings.manage");
  try {
    await assertOrigin();
    const input = hotelSchema.parse(Object.fromEntries(form));
    await db.$transaction(async tx => {
      if (input.currency !== auth.property.currency && await tx.booking.count({ where: { propertyId: auth.property.id } })) throw new Error("Currency has financial history");
      await tx.property.update({ where: { id: auth.property.id }, data: { name: input.name, timezone: input.timezone, currency: input.currency } });
      const row = await tx.configuration.upsert({ where: { propertyId_namespace: { propertyId: auth.property.id, namespace: "hotel" } }, create: { propertyId: auth.property.id, namespace: "hotel", draft: input, published: input }, update: { draft: input, published: input, version: { increment: 1 } } });
      await tx.configurationRevision.create({ data: { configurationId: row.id, version: row.version, actorId: auth.user.id, data: input } });
      await tx.auditLog.create({ data: { propertyId: auth.property.id, actorId: auth.user.id, action: "hotel.saved", entityType: "Property", entityId: auth.property.id, after: input } });
    });
    revalidatePath("/", "layout"); return { success: "Hotel information saved." };
  } catch (error) { return failure(error); }
}
