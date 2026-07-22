import { NextResponse } from "next/server";
import { getOrSyncUser } from "@/lib/data/users";
import {
  getSavedIds,
  saveListing,
  unsaveListing,
  mergeSaved,
} from "@/lib/data/saved";

export const runtime = "nodejs";

/** GET /api/saved → { ids } for the signed-in user (empty array if signed out). */
export async function GET() {
  const user = await getOrSyncUser();
  if (!user) return NextResponse.json({ ids: [] });
  return NextResponse.json({ ids: await getSavedIds(user.id) });
}

/**
 * POST /api/saved
 *  { listingId }        → save one
 *  { merge: string[] }  → merge local (signed-out) saves into the account
 * Returns the full updated id list.
 */
export async function POST(req: Request) {
  const user = await getOrSyncUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (Array.isArray(body.merge)) {
    await mergeSaved(user.id, body.merge);
  } else if (typeof body.listingId === "string") {
    await saveListing(user.id, body.listingId);
  } else {
    return NextResponse.json({ error: "listingId or merge required" }, { status: 400 });
  }
  return NextResponse.json({ ids: await getSavedIds(user.id) });
}

/** DELETE /api/saved?listingId=... → unsave one. Returns the updated id list. */
export async function DELETE(req: Request) {
  const user = await getOrSyncUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const listingId = new URL(req.url).searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }
  await unsaveListing(user.id, listingId);
  return NextResponse.json({ ids: await getSavedIds(user.id) });
}
