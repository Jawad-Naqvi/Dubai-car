import "server-only";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { log } from "@/lib/log";

/**
 * LISTING INTEGRITY — the checks that were missing entirely.
 *
 * Before this, the same chassis number could be listed unlimited times by any
 * number of sellers (no unique index, no lookup), a car could be published at
 * AED 0 or at ten times its peers, and a listing with zero photos was valid —
 * the code quietly substituted a stock Unsplash photo of someone else's car as
 * the hero image, which is a misrepresentation of the goods.
 *
 * Design: checks return SIGNALS, not verdicts. A hard block is reserved for
 * things that are unambiguously wrong (duplicate live VIN, no photos). Anything
 * judgement-based — a suspiciously low price — routes the listing to human
 * moderation instead, because an honest seller with a genuinely cheap car
 * should not be told they are a fraud.
 */

export type IntegritySeverity = "block" | "review" | "warn";

export interface IntegritySignal {
  code:
    | "duplicate_vin"
    | "vin_format"
    | "no_photos"
    | "price_too_low"
    | "price_outlier_low"
    | "price_outlier_high"
    | "stock_photo_only";
  severity: IntegritySeverity;
  message: string;
  detail?: Record<string, unknown>;
}

export interface IntegrityVerdict {
  signals: IntegritySignal[];
  /** Publishing must not proceed. */
  blocked: boolean;
  /** Publish is allowed but the listing goes to moderation first. */
  needsReview: boolean;
  blockingMessage?: string;
}

/** VINs are 17 chars and never use I, O or Q (they look like 1 and 0). */
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;

export function normalizeVin(raw?: string | null): string | null {
  const v = (raw ?? "").replace(/[\s-]/g, "").toUpperCase();
  return v.length ? v : null;
}

/**
 * Is this chassis number already on another LIVE listing?
 *
 * Scoped to live statuses on purpose: a seller relisting their own car after
 * archiving it is legitimate, and so is a car genuinely resold later. What is
 * not legitimate is the same VIN appearing on two active adverts at once —
 * the classic pattern for a cloned or non-existent vehicle.
 */
export async function findDuplicateVin(
  vin: string,
  excludeListingId?: string,
): Promise<{ id: string; slug: string } | null> {
  if (!isDbEnabled()) return null;
  const normalized = normalizeVin(vin);
  if (!normalized) return null;

  const conditions = [
    sql`upper(replace(${listings.vin}, ' ', '')) = ${normalized}`,
    sql`${listings.status} in ('active','pending_review','reserved')`,
  ];
  if (excludeListingId) conditions.push(ne(listings.id, excludeListingId));

  const rows = await db
    .select({ id: listings.id, slug: listings.slug })
    .from(listings)
    .where(and(...conditions))
    .limit(1);

  return rows[0] ?? null;
}

/** Median is used rather than mean: one absurd listing cannot drag it. */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Runs every integrity check for a listing about to be created or published.
 */
export async function checkListingIntegrity(input: {
  vin?: string | null;
  priceAED: number;
  make: string;
  model: string;
  year?: number;
  imageCount: number;
  saleMode?: string;
  excludeListingId?: string;
}): Promise<IntegrityVerdict> {
  const signals: IntegritySignal[] = [];

  /* --- Chassis number ------------------------------------------------ */
  const vin = normalizeVin(input.vin);
  if (vin) {
    if (!VIN_RE.test(vin)) {
      // A warning, not a block: some older and grey-import vehicles genuinely
      // carry non-standard chassis numbers.
      signals.push({
        code: "vin_format",
        severity: "warn",
        message:
          "That chassis number does not look like a standard 17-character VIN. Double-check it.",
      });
    }
    const dupe = await findDuplicateVin(vin, input.excludeListingId);
    if (dupe) {
      signals.push({
        code: "duplicate_vin",
        severity: "block",
        message:
          "This chassis number is already on another live listing. A car can only be advertised once at a time — archive the other listing first, or check the number.",
        detail: { existingListingId: dupe.id },
      });
    }
  }

  /* --- Photos -------------------------------------------------------- */
  // "Quote only" stock can legitimately be advertised without photos of the
  // specific unit; a retail car cannot.
  if (input.imageCount === 0 && input.saleMode !== "quote_only") {
    signals.push({
      code: "no_photos",
      severity: "block",
      message:
        "Add at least one photo of the actual car. Listings without real photos are not published.",
    });
  }

  /* --- Price --------------------------------------------------------- */
  if (input.saleMode !== "quote_only") {
    if (!input.priceAED || input.priceAED < 1000) {
      signals.push({
        code: "price_too_low",
        severity: "block",
        message:
          "Enter the real asking price. Listings priced at zero or near-zero are used for bait adverts and are not published.",
      });
    } else if (isDbEnabled()) {
      const peers = await db
        .select({ priceAED: listings.priceAED })
        .from(listings)
        .where(
          and(
            eq(listings.make, input.make),
            eq(listings.model, input.model),
            eq(listings.status, "active"),
          ),
        )
        .limit(200);

      // Four is the smallest sample where a median means anything.
      if (peers.length >= 4) {
        const mid = median(peers.map((p) => p.priceAED));
        if (mid > 0) {
          const ratio = input.priceAED / mid;
          if (ratio < 0.35) {
            signals.push({
              code: "price_outlier_low",
              severity: "review",
              message:
                "This price is far below similar cars, so the listing will be checked by our team before going live.",
              detail: { medianAED: mid, ratio: Number(ratio.toFixed(2)) },
            });
          } else if (ratio > 3) {
            signals.push({
              code: "price_outlier_high",
              severity: "warn",
              message:
                "This price is much higher than similar cars. Buyers filter on price — consider reviewing it.",
              detail: { medianAED: mid, ratio: Number(ratio.toFixed(2)) },
            });
          }
        }
      }
    }
  }

  const blocking = signals.find((s) => s.severity === "block");
  const verdict: IntegrityVerdict = {
    signals,
    blocked: !!blocking,
    needsReview: signals.some((s) => s.severity === "review"),
    blockingMessage: blocking?.message,
  };

  if (signals.length) {
    log.info("listing.integrity", {
      make: input.make,
      model: input.model,
      blocked: verdict.blocked,
      needsReview: verdict.needsReview,
      codes: signals.map((s) => s.code),
    });
  }

  return verdict;
}
