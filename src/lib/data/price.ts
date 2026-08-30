import "server-only";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings, priceHistory } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { bust } from "./revalidate";
import { dealRatingFromDb } from "./deal-rating";

export interface PricePoint {
  oldPrice: number;
  newPrice: number;
  changedAt: string;
}

/**
 * Change a listing's price, recording the old→new transition in price_history
 * and denormalising previous_price / price_updated_at onto the listing so cards
 * and the VDP can show a "price dropped" badge without an extra join.
 */
export async function updateListingPrice(
  listingId: string,
  newPrice: number,
): Promise<{ ok: boolean; oldPrice?: number; newPrice?: number; error?: string }> {
  if (!isDbEnabled()) return { ok: false, error: "Database not configured" };
  if (!Number.isFinite(newPrice) || newPrice < 1000 || newPrice > 50_000_000) {
    return { ok: false, error: "Price out of range" };
  }
  const [current] = await db
    .select({
      price: listings.priceAED,
      make: listings.make,
      model: listings.model,
    })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  if (!current) return { ok: false, error: "Listing not found" };
  const oldPrice = current.price;
  if (oldPrice === newPrice) return { ok: true, oldPrice, newPrice };

  await db.insert(priceHistory).values({ listingId, oldPrice, newPrice });
  // Refresh the deal rating against live peers at the new price so the "good
  // deal" badge/meter stays accurate after a reprice (it was previously frozen
  // at the value computed when the listing was first created).
  const dealRating = await dealRatingFromDb(
    current.make,
    current.model,
    newPrice,
    listingId,
  );
  await db
    .update(listings)
    .set({
      priceAED: newPrice,
      previousPrice: oldPrice,
      priceUpdatedAt: new Date(),
      dealRating: dealRating ?? null,
    })
    .where(eq(listings.id, listingId));

  bust("listings");
  return { ok: true, oldPrice, newPrice };
}

/** True for a canonical UUID — mock/demo listing ids ("L-001") are not. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Full price history for a listing, newest first. */
export async function getPriceHistory(listingId: string): Promise<PricePoint[]> {
  // Skip the DB round-trip for non-uuid (demo/mock) ids: Postgres rejects them
  // as "invalid input syntax for type uuid" and would 500 the detail page.
  if (!isDbEnabled() || !UUID_RE.test(listingId)) return [];
  try {
    const rows = await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.listingId, listingId))
      .orderBy(desc(priceHistory.changedAt))
      .limit(50);
    return rows.map((r) => ({
      oldPrice: r.oldPrice,
      newPrice: r.newPrice,
      changedAt: r.changedAt.toISOString(),
    }));
  } catch {
    // Table not migrated / transient error — degrade to no history.
    return [];
  }
}

/** Listing ids that had a price DROP since `since` (for saved-search alerts). */
export async function droppedListingIdsSince(since: Date): Promise<string[]> {
  if (!isDbEnabled()) return [];
  const rows = await db
    .selectDistinct({ listingId: priceHistory.listingId })
    .from(priceHistory)
    .where(and(gt(priceHistory.changedAt, since), gt(priceHistory.oldPrice, priceHistory.newPrice)));
  return rows.map((r) => r.listingId);
}

/** Count of price drops in a window — small helper for dashboards. */
export async function priceDropCountSince(since: Date): Promise<number> {
  if (!isDbEnabled()) return 0;
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(priceHistory)
    .where(and(gt(priceHistory.changedAt, since), gt(priceHistory.oldPrice, priceHistory.newPrice)));
  return row?.c ?? 0;
}
