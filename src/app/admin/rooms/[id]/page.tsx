import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "../../../../server/db";
import { requireUser } from "../../../../server/auth";
import { RoomEditor } from "../../../../components/room-editor";
import { ActionForm } from "../../../../components/action-form";
import { archiveRoom, duplicateRoom } from "../../../../server/room-actions";
export default async function RoomEdit({ params }: { params: Promise<{ id: string }> }) {
  const { property } = await requireUser("rooms.edit");
  const { id } = await params;
  const [room, amenities, media] = await Promise.all([
    id === "new" ? null : db.roomType.findFirst({ where: { id, propertyId: property.id, deletedAt: null }, include: { amenities: true, images: { orderBy: { position: "asc" } } } }),
    db.amenity.findMany({ where: { propertyId: property.id, active: true }, orderBy: { name: "asc" } }),
    db.media.findMany({ where: { propertyId: property.id, state: "READY" }, orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  if (id !== "new" && !room) notFound();
  return <><Link className="back-link" href="/admin/rooms">← Room types</Link><div className="page-heading"><div><h1>{room ? room.name : "A new room."}</h1><p className="muted">Details, comfort, and a sense of place.</p></div></div><section className="panel padded"><RoomEditor currency={property.currency} amenities={amenities} media={media} room={room ? { ...room, basePrice: room.basePrice.toString(), attributes: room.attributes as Record<string,unknown>, amenityIds: room.amenities.map(a=>a.amenityId), mediaId: room.images[0]?.mediaId ?? "" } : undefined} /></section>{room && <section className="panel padded"><h2>Room actions</h2><div className="form-grid"><ActionForm action={duplicateRoom} label="Duplicate as draft"><input type="hidden" name="id" value={room.id} /><p className="muted">Copy details and photos to a new room type.</p></ActionForm><ActionForm action={archiveRoom} label="Archive room"><input type="hidden" name="id" value={room.id} /><label>Type ARCHIVE to hide this room<input name="confirmation" required pattern="ARCHIVE" /></label></ActionForm></div></section>}</>;
}
