import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Serves an uploaded image stored in Postgres (see src/lib/media.ts). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isDbEnabled() || !UUID_RE.test(id)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const [row] = await db
    .select({
      data: mediaAssets.data,
      mimeType: mediaAssets.mimeType,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);

  if (!row) return new NextResponse("Not found", { status: 404 });

  // node-postgres returns bytea as a Node Buffer.
  const body = new Uint8Array(row.data);
  return new NextResponse(body, {
    headers: {
      "Content-Type": row.mimeType || "image/jpeg",
      "Content-Length": String(body.byteLength),
      // Immutable content addressed by id — cache hard.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
