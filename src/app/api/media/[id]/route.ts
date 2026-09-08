import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { getOrSyncUser } from "@/lib/data/users";
import { getMyOrgs, isPlatformAdmin } from "@/lib/data/orgs";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Serves an uploaded file stored in Postgres (see src/lib/media.ts).
 *
 * SECURITY: this route previously had no authorization at all, which meant
 * every identity document — Emirates ID scans, trade licences — was readable
 * by anyone who had or guessed its id, and was additionally served with
 * `Cache-Control: public, immutable` so proxies would keep copies. The
 * ownership check on /api/kyc-doc/[dealerId] was therefore decorative: you
 * could route around it by requesting the underlying media id directly.
 *
 * Assets are now classified. Public assets (listing photos) still serve fast
 * and cacheable. Private assets require the uploader, a member of the owning
 * organization, or a platform admin — and are marked no-store so they are
 * never retained by a shared cache.
 */
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
      visibility: mediaAssets.visibility,
      ownerUserId: mediaAssets.ownerUserId,
      ownerOrgId: mediaAssets.ownerOrgId,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);

  if (!row) return new NextResponse("Not found", { status: 404 });

  const isPrivate = row.visibility === "private";

  if (isPrivate) {
    const user = await getOrSyncUser().catch(() => null);
    if (!user) return new NextResponse("Not found", { status: 404 });

    let allowed = row.ownerUserId === user.id;

    if (!allowed && row.ownerOrgId) {
      const orgs = await getMyOrgs().catch(() => []);
      allowed = orgs.some((o) => o.id === row.ownerOrgId);
    }
    if (!allowed) allowed = await isPlatformAdmin().catch(() => false);

    // 404 rather than 403: a probe should not be able to confirm that a given
    // document id exists just because it is forbidden.
    if (!allowed) return new NextResponse("Not found", { status: 404 });
  }

  // node-postgres returns bytea as a Node Buffer.
  const body = new Uint8Array(row.data);
  return new NextResponse(body, {
    headers: {
      "Content-Type": row.mimeType || "image/jpeg",
      "Content-Length": String(body.byteLength),
      "Cache-Control": isPrivate
        ? "private, no-store, max-age=0"
        : "public, max-age=31536000, immutable",
    },
  });
}
