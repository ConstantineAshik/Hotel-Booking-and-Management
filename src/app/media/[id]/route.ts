import { db } from "../../../server/db";
import { localStorage } from "../../../server/storage";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 404 });
  const media = await db.media.findFirst({ where: { id, state: "READY" } });
  if (!media) return new Response(null, { status: 404 });
  try {
    const bytes = await localStorage.read(media.storageKey);
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 404 }); }
}
