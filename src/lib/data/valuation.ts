import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings, valuations } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import {
  estimateValue,
  type ValuationInput,
  type ValuationResult,
} from "@/lib/valuation";
import { demoStore, demoId } from "./demo-store";
import { mockListings } from "@/lib/mock-data";

/**
 * Computes a valuation and persists it. In DB mode it derives the base price
 * from live comparable listings (same make, ±3 model years) when at least 2
 * exist, otherwise falls back to the static model.
 */
export async function valuateAndStore(
  input: ValuationInput,
  userId?: string,
): Promise<ValuationResult> {
  let marketBase: number | undefined;
  let comps = 0;

  if (isDbEnabled()) {
    const rows = await db
      .select({ price: listings.priceAED })
      .from(listings)
      .where(
        and(
          eq(listings.make, input.make),
          sql`abs(${listings.year} - ${input.year}) <= 3`,
          eq(listings.status, "active"),
        ),
      )
      .limit(50);
    if (rows.length >= 2) {
      comps = rows.length;
      marketBase =
        rows.reduce((s, r) => s + r.price, 0) / rows.length;
    }
  } else {
    const matches = mockListings.filter(
      (l) => l.make === input.make && Math.abs(l.year - input.year) <= 3,
    );
    if (matches.length >= 2) {
      comps = matches.length;
      marketBase =
        matches.reduce((s, l) => s + l.priceAED, 0) / matches.length;
    }
  }

  const result = estimateValue(input, marketBase);
  result.comps = comps;

  if (isDbEnabled()) {
    await db.insert(valuations).values({
      userId,
      inputs: input,
      estimatedValueAED: result.estimate,
      confidence: comps >= 2 ? 0.85 : 0.6,
    });
  } else {
    demoStore().valuations.unshift({
      id: demoId("VAL"),
      make: input.make,
      model: input.model,
      year: input.year,
      kms: input.kms,
      condition: input.condition,
      estimatedValueAED: result.estimate,
      low: result.low,
      high: result.high,
      createdAt: new Date().toISOString(),
    });
  }

  return result;
}
