import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { computeDealRating } from "@/lib/vehicle-derive";

/**
 * Recompute a listing's deal rating ("Great"/"Good"/"Fair") from the current
 * same-make peers in the database. Unlike the one-shot rating stored at
 * creation time, this reflects live inventory — so a car's badge stays accurate
 * as comparable cars are added or repriced.
 *
 * We fetch by make (computeDealRating narrows to same-model when there are
 * enough of them, else falls back to make) and pass the subject's own
 * make/model/price explicitly so it's always part of the price universe even
 * when `excludeId` removes its stale DB row.
 */
export async function dealRatingFromDb(
  make: string,
  model: string,
  priceAED: number,
  excludeId?: string,
): Promise<string | null> {
  const where = excludeId
    ? and(eq(listings.make, make), ne(listings.id, excludeId))
    : eq(listings.make, make);
  const peers = await db
    .select({
      make: listings.make,
      model: listings.model,
      priceAED: listings.priceAED,
    })
    .from(listings)
    .where(where);
  return computeDealRating(
    { make, model, priceAED },
    [...peers, { make, model, priceAED }],
  );
}
