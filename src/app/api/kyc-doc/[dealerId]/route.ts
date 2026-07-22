import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dealers, mediaAssets } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { getOrSyncUser, isAdminAllowed } from "@/lib/data/users";

export const runtime = "nodejs";

const FIELD_COLUMN = {
  emiratesIdFront: dealers.emiratesIdFrontUrl,
  emiratesIdBack: dealers.emiratesIdBackUrl,
  tradeLicense: dealers.tradeLicenseDocUrl,
} as const;
type Field = keyof typeof FIELD_COLUMN;

const MEDIA_ID_RE = /^\/api\/media\/([0-9a-f-]{36})$/i;

/**
 * Auth-gated retrieval for a dealer's KYC documents — only the submitting
 * dealer or an admin can view these, unlike the public /api/media/[id] route
 * used for listing photos. Streams Postgres-stored bytes directly rather than
 * redirecting through the public media route.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ dealerId: string }> },
) {
  if (!isDbEnabled()) return new NextResponse("Not found", { status: 404 });
  const { dealerId } = await params;

  const field = new URL(req.url).searchParams.get("field") as Field | null;
  if (!field || !(field in FIELD_COLUMN)) {
    return NextResponse.json({ error: "Unknown document field" }, { status: 400 });
  }

  const [dealer] = await db
    .select({ id: dealers.id, userId: dealers.userId, url: FIELD_COLUMN[field] })
    .from(dealers)
    .where(eq(dealers.id, dealerId))
    .limit(1);
  if (!dealer) return new NextResponse("Not found", { status: 404 });

  const isAdmin = await isAdminAllowed();
  if (!isAdmin) {
    const user = await getOrSyncUser();
    if (!user || user.id !== dealer.userId) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
  }

  if (!dealer.url) return new NextResponse("Not found", { status: 404 });

  const mediaMatch = dealer.url.match(MEDIA_ID_RE);
  if (mediaMatch) {
    const [row] = await db
      .select({ data: mediaAssets.data, mimeType: mediaAssets.mimeType })
      .from(mediaAssets)
      .where(eq(mediaAssets.id, mediaMatch[1]))
      .limit(1);
    if (!row) return new NextResponse("Not found", { status: 404 });
    const body = new Uint8Array(row.data);
    return new NextResponse(body, {
      headers: {
        "Content-Type": row.mimeType || "application/octet-stream",
        "Content-Length": String(body.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  }

  // R2 (external CDN URL) or local-disk fallback path — redirect. Neither is
  // reachable without the exact random key, and R2 isn't configured yet.
  return NextResponse.redirect(dealer.url);
}
