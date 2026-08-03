import "server-only";

/**
 * Individual (private-seller) per-listing fee.
 *
 * Business rule from the client: a single-car listing costs the GREATER of a
 * flat minimum or a small percentage of the asking price ("100 AED or 0.95%,
 * whichever is higher"). Both numbers are provisional and configurable, since
 * final pricing is still TBD.
 *
 * DISABLED by default — during the launch period listing is free for everyone
 * (LISTING_FEE_ENABLED unset/false). Dealers never pay per-listing; their
 * listings are covered by their subscription tier. The fee only ever applies to
 * individual private-seller listings, and only when the flag is on.
 *
 * Env:
 *   LISTING_FEE_ENABLED     "true" to charge individuals per listing
 *   LISTING_FEE_MIN_AED     flat minimum (default 100)
 *   LISTING_FEE_PERCENT     percent of price (default 0.95)
 */
export function isListingFeeEnabled(): boolean {
  return process.env.LISTING_FEE_ENABLED === "true";
}

export function listingFeeMinAED(): number {
  const v = Number(process.env.LISTING_FEE_MIN_AED);
  return Number.isFinite(v) && v > 0 ? v : 100;
}

export function listingFeePercent(): number {
  const v = Number(process.env.LISTING_FEE_PERCENT);
  return Number.isFinite(v) && v > 0 ? v : 0.95;
}

/** Fee in AED = max(min flat, percent of price), rounded up to the dirham. */
export function computeListingFee(priceAED: number): number {
  const pct = Math.ceil((priceAED * listingFeePercent()) / 100);
  return Math.max(listingFeeMinAED(), pct);
}
