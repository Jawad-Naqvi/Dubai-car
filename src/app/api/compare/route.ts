import { NextResponse } from "next/server";
import { getOrSyncUser } from "@/lib/data/users";
import {
  getCompareIds,
  addCompare,
  removeCompare,
  clearCompare,
  mergeCompare,
} from "@/lib/data/compare";

export const runtime = "nodejs";

/** GET /api/compare → { ids } for the signed-in user (empty if signed out). */
export async function GET() {
  const user = await getOrSyncUser();
  if (!user) return NextResponse.json({ ids: [] });
  return NextResponse.json({ ids: await getCompareIds(user.id) });
}

/**
 * POST /api/compare
 *  { listingId }        → add one (409 if the 3-car tray is full)
 *  { merge: string[] }  → merge local (signed-out) tray into the account
 * Returns the full updated id list.
 */
export async function POST(req: Request) {
  const user = await getOrSyncUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (Array.isArray(body.merge)) {
    await mergeCompare(user.id, body.merge);
  } else if (typeof body.listingId === "string") {
    const res = await addCompare(user.id, body.listingId);
    if (res.full) {
      return NextResponse.json(
        { error: "Compare tray is full", ids: await getCompareIds(user.id) },
        { status: 409 },
      );
    }
  } else {
    return NextResponse.json({ error: "listingId or merge required" }, { status: 400 });
  }
  return NextResponse.json({ ids: await getCompareIds(user.id) });
}

/** DELETE /api/compare?listingId=... (or ?all=1) → remove one / clear. */
export async function DELETE(req: Request) {
  const user = await getOrSyncUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const params = new URL(req.url).searchParams;
  if (params.get("all")) {
    await clearCompare(user.id);
  } else {
    const listingId = params.get("listingId");
    if (!listingId) {
      return NextResponse.json({ error: "listingId required" }, { status: 400 });
    }
    await removeCompare(user.id, listingId);
  }
  return NextResponse.json({ ids: await getCompareIds(user.id) });
}
