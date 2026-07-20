import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { updateListingPrice } from "@/lib/data/price";
import { getOrSyncUser, getCurrentDealer, isAdminAllowed, dashboardsOpen } from "@/lib/data/users";

export const runtime = "nodejs";

/**
 * PATCH /api/listings/[id]/price  { price } → reprice a listing (records history
 * + a price-drop badge). Allowed for the listing's owner (dealer/seller), an
 * admin, or in open-testing mode.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const price = Number(body.price);
  if (!Number.isFinite(price)) {
    return NextResponse.json({ error: "price required" }, { status: 400 });
  }

  // Authorisation: owner, admin, or open-testing mode.
  let allowed = await isAdminAllowed();
  if (!allowed && dashboardsOpen()) allowed = true;
  if (!allowed) {
    const user = await getOrSyncUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    const [row] = await db
      .select({ dealerId: listings.dealerId, sellerId: listings.sellerId })
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    const dealer = await getCurrentDealer();
    allowed =
      (!!row?.sellerId && row.sellerId === user.id) ||
      (!!row?.dealerId && !!dealer && row.dealerId === dealer.id);
  }
  if (!allowed) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const res = await updateListingPrice(id, price);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  return NextResponse.json(res);
}
