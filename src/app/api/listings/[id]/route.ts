import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { updateListingStatus, deleteListing } from "@/lib/data/dashboard";
import { updateListing } from "@/lib/data/listing-write";
import { getOrSyncUser, getCurrentDealer, isAdminAllowed, dashboardsOpen } from "@/lib/data/users";
import { isDbEnabled } from "@/lib/db/enabled";
import { demoStore } from "@/lib/data/demo-store";

/**
 * Authorise a mutation on listing `id`: the listing's owner (private seller
 * or the dealer it belongs to), an admin, or open-testing mode. Mirrors the
 * ownership check in `price/route.ts` — this route previously had none at
 * all, so any request could edit or delete any listing.
 */
async function canMutateListing(id: string): Promise<boolean> {
  if (await isAdminAllowed()) return true;
  if (dashboardsOpen()) return true;
  const user = await getOrSyncUser();
  if (!user) return false;

  if (!isDbEnabled()) {
    const listing = demoStore().newListings.find((l) => l.id === id);
    return !!listing && listing.ownerUserId === user.id;
  }

  const [row] = await db
    .select({ dealerId: listings.dealerId, sellerId: listings.sellerId })
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  if (!row) return false;
  const dealer = await getCurrentDealer();
  return (
    (!!row.sellerId && row.sellerId === user.id) ||
    (!!row.dealerId && !!dealer && row.dealerId === dealer.id)
  );
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!(await canMutateListing(id))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return new NextResponse("Invalid JSON", { status: 400 });
  await updateListingStatus(id, {
    status: body.status,
    isFeatured: body.isFeatured,
  });
  return NextResponse.json({ ok: true });
}

/**
 * PUT /api/listings/[id] — full self-service edit of a listing by its owner
 * (private seller or the dealer it belongs to). updateListing re-checks
 * ownership, records price history on a price change, and refreshes the deal
 * rating. Distinct from PATCH, which only flips status/featured.
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getOrSyncUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return new NextResponse("Invalid JSON", { status: 400 });
  try {
    const res = await updateListing(id, body, user);
    if (!res.ok) {
      return NextResponse.json(
        { error: res.error },
        { status: res.error === "Not allowed" ? 403 : 400 },
      );
    }
    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid input" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!(await canMutateListing(id))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  await deleteListing(id);
  return NextResponse.json({ ok: true });
}
