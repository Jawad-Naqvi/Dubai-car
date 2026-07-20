import type { MockListing } from "@/lib/mock-data";
import type { DealRating } from "@/lib/brand";

/**
 * Derived vehicle attributes.
 *
 * Some cars.com-style facets (drivetrain, deal rating) aren't stored on every
 * listing. Rather than hand-annotate the seed data, we derive them
 * deterministically so filtering, facet counts, and display all agree.
 *
 * When a listing DOES carry a real value (dealer-entered `drivetrain`), that
 * wins — derivation is only the fallback.
 */

const RWD_HINT = /\b(m4|m3|amg gt|911|carrera|cayman|boxster|mustang|supra|rx|gr86|brz|corvette|challenger|charger)\b/i;
const FWD_MODELS = /\b(corolla|camry|civic|accord|elantra|sonata|altima|maxima|golf|jetta|passat|mazda3|mazda6|a3|prius)\b/i;

/** Best-effort drivetrain when a listing has none stored. */
export function deriveDrivetrain(l: Pick<MockListing, "make" | "model" | "bodyType"> & { drivetrain?: string }): string {
  if (l.drivetrain) return l.drivetrain;
  const key = `${l.make} ${l.model}`;
  if (l.bodyType === "SUV" || l.bodyType === "Pickup") return "Four-wheel Drive";
  if (RWD_HINT.test(key) || l.bodyType === "Convertible") return "Rear-wheel Drive";
  if (FWD_MODELS.test(key) || l.bodyType === "Hatchback") return "Front-wheel Drive";
  if (l.bodyType === "Coupe" || l.bodyType === "Wagon") return "All-wheel Drive";
  return "All-wheel Drive";
}

/** Median of a numeric array (0 for empty). */
function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Deal rating for a listing versus its peers (same make+model; if fewer than
 * three peers exist, widen to the whole make so new/rare models still rate).
 *   ≤ 92% of peer median → Great, ≤ 104% → Good, otherwise → Fair.
 * Returns null when there's no usable baseline.
 */
type PricedVehicle = Pick<MockListing, "make" | "model" | "priceAED">;

export function computeDealRating(
  listing: PricedVehicle,
  universe: PricedVehicle[],
): DealRating | null {
  const sameModel = universe.filter(
    (l) => l.make === listing.make && l.model === listing.model && l.priceAED > 0,
  );
  const peers = sameModel.length >= 3
    ? sameModel
    : universe.filter((l) => l.make === listing.make && l.priceAED > 0);
  if (peers.length < 2) return null;
  const base = median(peers.map((l) => l.priceAED));
  if (base <= 0) return null;
  const ratio = listing.priceAED / base;
  if (ratio <= 0.92) return "Great";
  if (ratio <= 1.04) return "Good";
  return "Fair";
}
