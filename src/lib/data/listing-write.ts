import "server-only";
import { z } from "zod";
import { eq, sql, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings, listingMedia, dealers, priceHistory } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { checkListingIntegrity } from "./integrity";
import { slugify } from "@/lib/utils";
import { deriveDrivetrain, computeDealRating } from "@/lib/vehicle-derive";
import { dealRatingFromDb } from "./deal-rating";
import { demoStore, demoId, type DemoListing } from "./demo-store";
import { bust } from "./revalidate";
import { isListingFeeEnabled, computeListingFee } from "./listing-fee";
import type { CurrentUser } from "./users";

export const listingInputSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  trim: z.string().optional(),
  year: z.coerce.number().int().min(1980).max(2027),
  kms: z.coerce.number().int().min(0).max(1_000_000),
  // Quote-only stock carries no public price, so 0 is allowed there.
  priceAED: z.coerce.number().int().min(0).max(50_000_000),
  /** Purchase configuration — decides the buyer's CTAs on the listing page. */
  saleMode: z.enum(["retail", "both", "quote_only"]).optional(),
  bulkMinQty: z.coerce.number().int().min(2).max(999).optional(),
  stockQty: z.coerce.number().int().min(1).max(9999).optional(),
  bodyType: z.string().optional(),
  fuel: z.string().optional(),
  transmission: z.string().optional(),
  regionalSpec: z.string().optional(),
  colorExterior: z.string().optional(),
  colorInterior: z.string().optional(),
  emirate: z.string().min(1, "Emirate is required"),
  condition: z.string().optional(),
  vin: z.string().optional(),
  cylinders: z.coerce.number().int().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  isExportReady: z.boolean().optional(),
  images: z.array(z.string()).optional(),
  // contact for private sellers
  sellerName: z.string().optional(),
  sellerPhone: z.string().optional(),
});

export type ListingInput = z.infer<typeof listingInputSchema>;

/**
 * A half-finished listing. Only enough to identify the car is required —
 * everything else takes a safe placeholder so an in-progress wizard can always
 * be parked without tripping publish-time validation.
 */
export const draftInputSchema = listingInputSchema.partial().extend({
  make: z.string().min(1, "Add a make before saving a draft"),
  model: z.string().min(1, "Add a model before saving a draft"),
  year: z.coerce.number().int().min(1980).max(2027).optional(),
  kms: z.coerce.number().int().min(0).max(1_000_000).optional(),
  priceAED: z.coerce.number().int().min(0).max(50_000_000).optional(),
  emirate: z.string().optional(),
}).transform((d) => ({
  ...d,
  year: d.year ?? new Date().getFullYear(),
  kms: d.kms ?? 0,
  priceAED: d.priceAED ?? 0,
  emirate: d.emirate || "Dubai",
})) as unknown as typeof listingInputSchema;

export interface CreateListingResult {
  id: string;
  slug: string;
  status: string;
  /** Set when an individual must pay a per-listing fee before it's reviewed. */
  feeRequired?: boolean;
  feeAED?: number;
}

export async function createListing(
  raw: unknown,
  user?: CurrentUser,
  opts: {
    /**
     * Save without publishing. A draft is private to its owner, so it does NOT
     * require Emirates ID verification and never triggers a listing fee —
     * sellers can prepare a listing while their ID is still being verified
     * instead of losing everything they typed.
     */
    asDraft?: boolean;
  } = {},
): Promise<CreateListingResult> {
  const input = opts.asDraft
    ? draftInputSchema.parse(raw)
    : listingInputSchema.parse(raw);
  const slug = slugify(
    input.year,
    input.make,
    input.model,
    input.trim ?? "",
    Math.random().toString(36).slice(2, 6),
  );
  const images = (input.images ?? []).filter(Boolean);

  if (!isDbEnabled()) {
    const store = demoStore();
    const listing: DemoListing = {
      id: demoId("L"),
      slug,
      make: input.make,
      model: input.model,
      trim: input.trim,
      year: input.year,
      kms: input.kms,
      priceAED: input.priceAED,
      bodyType: input.bodyType ?? "—",
      fuel: input.fuel ?? "—",
      transmission: input.transmission ?? "—",
      regionalSpec: input.regionalSpec ?? "GCC",
      exteriorColor: input.colorExterior ?? "—",
      emirate: input.emirate,
      dealer: {
        id: user?.id ?? "private",
        slug: "private-seller",
        name: user?.name ?? input.sellerName ?? "Private Seller",
        isVerified: false,
        rating: 0,
        reviewCount: 0,
      },
      isFeatured: false,
      isInspected: false,
      isExportReady: !!input.isExportReady,
      saleMode: input.saleMode ?? "retail",
      bulkMinQty: input.bulkMinQty ?? 5,
      stockQty: input.stockQty ?? 1,
      isNew: input.condition === "New",
      status: "active",
      // No stock-photo fallback: substituting a generic image of a different
      // car misrepresents the goods. Real listings must carry real photos
      // (enforced by checkListingIntegrity); drafts may legitimately have none.
      imageUrl: images[0] ?? "",
      imageUrls: images,
      description: input.description ?? "",
      features: input.features ?? [],
      moderationStatus: opts.asDraft ? "draft" : "pending_review",
      ownerUserId: user?.id,
      createdAt: new Date().toISOString(),
      viewCount: 0,
      inquiryCount: 0,
    };
    store.newListings.unshift(listing);
    bust("listings");
    return {
      id: listing.id,
      slug,
      status: opts.asDraft ? "draft" : "pending_review",
    };
  }

  // ---- DB mode ----
  let dealerId: string | undefined;
  let dealerVerified = false;
  if (user) {
    const d = await db
      .select({ id: dealers.id, isVerified: dealers.isVerified })
      .from(dealers)
      .where(eq(dealers.userId, user.id))
      .limit(1);
    dealerId = d[0]?.id;
    dealerVerified = d[0]?.isVerified ?? false;
  }
  // Identity gate: every seller must have an Emirates ID on file (individuals
  // via /verify-identity, dealers via onboarding). Verified dealers are always
  // allowed. This enforces the "Emirates ID required to sell" rule server-side.
  // Drafts are exempt — they're private, so preparing one is always allowed.
  const idOnFile = !!user?.emiratesIdNumber;
  if (!opts.asDraft && !dealerVerified && !idOnFile) {
    throw new Error(
      "Please verify your Emirates ID before listing a car.",
    );
  }

  // Integrity gate. Runs BEFORE anything is written: a duplicate live chassis
  // number, a bait price or a listing with no real photos must never reach the
  // marketplace, and a suspiciously cheap car is routed to a human rather than
  // rejected outright.
  const integrity = await checkListingIntegrity({
    vin: input.vin,
    priceAED: input.priceAED,
    make: input.make,
    model: input.model,
    year: input.year,
    imageCount: images.length,
    saleMode: input.saleMode,
  });
  if (!opts.asDraft && integrity.blocked) {
    throw new Error(integrity.blockingMessage ?? "This listing cannot be published.");
  }

  // KYC-approved dealers publish instantly — moderation is for unvetted
  // sellers (private listings, or dealers still pending approval). An
  // integrity signal overrides that: it goes to review whoever posted it.
  const initialStatus =
    dealerVerified && !integrity.needsReview ? "active" : "pending_review";

  // Individual per-listing fee (default OFF during the free launch). When on,
  // a private-seller listing is held as an unpaid "draft" and the caller is
  // told a fee is due; the Stripe webhook flips it to pending_review on payment.
  // Dealers (any dealerId) are exempt — their listings are covered by their tier.
  const feeApplies = !opts.asDraft && isListingFeeEnabled() && !dealerId;
  const feeAED = feeApplies ? computeListingFee(input.priceAED) : 0;
  const finalStatus = opts.asDraft
    ? "draft"
    : feeApplies
      ? "draft"
      : initialStatus;

  // Denormalise the cars.com-style facets so search stays a plain column read.
  const drivetrain = deriveDrivetrain({
    make: input.make,
    model: input.model,
    bodyType: input.bodyType ?? "",
  });
  const peers = await db
    .select({ make: listings.make, model: listings.model, priceAED: listings.priceAED })
    .from(listings)
    .where(and(eq(listings.make, input.make), eq(listings.model, input.model)));
  const dealRating = computeDealRating(
    { make: input.make, model: input.model, priceAED: input.priceAED },
    [...peers, { make: input.make, model: input.model, priceAED: input.priceAED }],
  );

  const [row] = await db
    .insert(listings)
    .values({
      slug,
      dealerId,
      sellerId: dealerId ? undefined : user?.id,
      make: input.make,
      model: input.model,
      trim: input.trim,
      year: input.year,
      kms: input.kms,
      priceAED: input.priceAED,
      bodyType: input.bodyType,
      fuel: input.fuel,
      transmission: input.transmission,
      drivetrain,
      dealRating: dealRating ?? undefined,
      regionalSpec: input.regionalSpec,
      colorExterior: input.colorExterior,
      colorInterior: input.colorInterior,
      emirate: input.emirate,
      condition: input.condition,
      vin: input.vin,
      cylinders: input.cylinders,
      description: input.description,
      features: input.features ?? [],
      isExportReady: !!input.isExportReady,
      saleMode: input.saleMode ?? "retail",
      bulkMinQty: input.bulkMinQty ?? 5,
      stockQty: input.stockQty ?? 1,
      status: finalStatus,
      ...(finalStatus === "active" ? { publishedAt: new Date() } : {}),
    })
    .returning({ id: listings.id, slug: listings.slug });

  if (images.length) {
    await db.insert(listingMedia).values(
      images.map((url, i) => ({
        listingId: row.id,
        url,
        type: "photo",
        isHero: i === 0,
        sortOrder: i,
      })),
    );
  }

  if (dealerId) {
    await db
      .update(dealers)
      .set({ listingQuotaUsed: sql`${dealers.listingQuotaUsed} + 1` })
      .where(eq(dealers.id, dealerId));
  }

  bust("listings");
  return {
    id: row.id,
    slug: row.slug,
    status: finalStatus,
    ...(feeApplies ? { feeRequired: true, feeAED } : {}),
  };
}

/* ------------------------------------------------------------------ */
/* Edit an existing listing (owner self-service)                      */
/* ------------------------------------------------------------------ */

/** The full editable shape of a listing, prefilled into the edit form. */
export interface EditableListing {
  id: string;
  slug: string;
  make: string;
  model: string;
  trim: string;
  year: number;
  kms: number;
  priceAED: number;
  bodyType: string;
  fuel: string;
  transmission: string;
  regionalSpec: string;
  condition: string;
  colorExterior: string;
  colorInterior: string;
  cylinders: string;
  vin: string;
  emirate: string;
  description: string;
  features: string[];
  isExportReady: boolean;
  images: string[];
  status: string;
}

/**
 * Take a saved draft live. This is where the Emirates-ID gate actually bites —
 * saving is always allowed, publishing is not — so a seller can build the
 * listing first and verify second without ever retyping it.
 */
export async function publishDraft(
  id: string,
  user: CurrentUser,
): Promise<{ status: string }> {
  if (!isDbEnabled()) {
    const listing = demoStore().newListings.find((l) => l.id === id);
    if (!listing) throw new Error("Listing not found.");
    listing.moderationStatus = "pending_review";
    bust("listings");
    return { status: "pending_review" };
  }

  const [d] = await db
    .select({ id: dealers.id, isVerified: dealers.isVerified })
    .from(dealers)
    .where(eq(dealers.userId, user.id))
    .limit(1);
  const dealerVerified = d?.isVerified ?? false;

  if (!dealerVerified && !user.emiratesIdNumber) {
    throw new Error(
      "Please verify your Emirates ID to publish this listing. Your draft is saved.",
    );
  }

  const [current] = await db
    .select({ priceAED: listings.priceAED, status: listings.status })
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  if (!current) throw new Error("Listing not found.");
  if (!(current.priceAED > 0)) {
    throw new Error("Add an asking price before publishing.");
  }

  const status = dealerVerified ? "active" : "pending_review";
  await db
    .update(listings)
    .set({
      status,
      updatedAt: new Date(),
      ...(status === "active" ? { publishedAt: new Date() } : {}),
    })
    .where(eq(listings.id, id));
  bust("listings");
  return { status };
}

/**
 * Resolve the id of the dealer a user owns (if any). Mirrors the lookup in
 * createListing so ownership checks agree across create/edit.
 */
async function dealerIdForUser(userId: string): Promise<string | undefined> {
  const d = await db
    .select({ id: dealers.id })
    .from(dealers)
    .where(eq(dealers.userId, userId))
    .limit(1);
  return d[0]?.id;
}

/**
 * Load a listing for editing, but ONLY if `user` owns it (private seller via
 * sellerId, or the dealer it belongs to). Returns null when the listing doesn't
 * exist or isn't the caller's — so a page can 404 rather than leak another
 * seller's car into an edit form. Demo mode reads from the in-memory store.
 */
export async function getEditableListing(
  id: string,
  user: CurrentUser,
): Promise<EditableListing | null> {
  if (!isDbEnabled()) {
    const l = demoStore().newListings.find((x) => x.id === id);
    if (!l || l.ownerUserId !== user.id) return null;
    return {
      id: l.id,
      slug: l.slug,
      make: l.make,
      model: l.model,
      trim: l.trim ?? "",
      year: l.year,
      kms: l.kms,
      priceAED: l.priceAED,
      bodyType: l.bodyType ?? "",
      fuel: l.fuel ?? "",
      transmission: l.transmission ?? "",
      regionalSpec: l.regionalSpec ?? "GCC",
      condition: l.isNew ? "New" : "Used",
      colorExterior: l.exteriorColor ?? "",
      colorInterior: "",
      cylinders: "",
      vin: l.vin ?? "",
      emirate: l.emirate,
      description: l.description ?? "",
      features: l.features ?? [],
      isExportReady: !!l.isExportReady,
      images: l.imageUrls ?? [],
      status: l.status,
    };
  }

  const [row] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  if (!row) return null;

  const owns =
    (!!row.sellerId && row.sellerId === user.id) ||
    (!!row.dealerId && row.dealerId === (await dealerIdForUser(user.id)));
  if (!owns) return null;

  const media = await db
    .select({ url: listingMedia.url })
    .from(listingMedia)
    .where(eq(listingMedia.listingId, id))
    .orderBy(listingMedia.sortOrder);

  return {
    id: row.id,
    slug: row.slug,
    make: row.make,
    model: row.model,
    trim: row.trim ?? "",
    year: row.year,
    kms: row.kms,
    priceAED: row.priceAED,
    bodyType: row.bodyType ?? "",
    fuel: row.fuel ?? "",
    transmission: row.transmission ?? "",
    regionalSpec: row.regionalSpec ?? "GCC",
    condition: row.condition ?? "Used",
    colorExterior: row.colorExterior ?? "",
    colorInterior: row.colorInterior ?? "",
    cylinders: row.cylinders != null ? String(row.cylinders) : "",
    vin: row.vin ?? "",
    emirate: row.emirate,
    description: row.description ?? "",
    features: (row.features as string[] | null) ?? [],
    isExportReady: !!row.isExportReady,
    images: media.map((m) => m.url),
    status: row.status,
  };
}

export interface UpdateListingResult {
  ok: boolean;
  id?: string;
  slug?: string;
  error?: string;
}

/**
 * Update an existing listing the caller owns. Records a price-history row (and
 * the previous_price / price_updated_at "price drop" signal) when the asking
 * price changes, refreshes the deal rating against live peers, and replaces the
 * photo set when new images are supplied. The URL slug is intentionally kept
 * stable so existing links and SEO don't break.
 */
export async function updateListing(
  id: string,
  raw: unknown,
  user: CurrentUser,
): Promise<UpdateListingResult> {
  const input = listingInputSchema.parse(raw);

  if (!isDbEnabled()) {
    const store = demoStore();
    const l = store.newListings.find((x) => x.id === id);
    if (!l || l.ownerUserId !== user.id) {
      return { ok: false, error: "Not found" };
    }
    l.make = input.make;
    l.model = input.model;
    l.trim = input.trim;
    l.year = input.year;
    l.kms = input.kms;
    l.priceAED = input.priceAED;
    l.bodyType = input.bodyType ?? l.bodyType;
    l.fuel = input.fuel ?? l.fuel;
    l.transmission = input.transmission ?? l.transmission;
    l.regionalSpec = input.regionalSpec ?? l.regionalSpec;
    l.exteriorColor = input.colorExterior ?? l.exteriorColor;
    l.vin = input.vin;
    l.emirate = input.emirate;
    l.description = input.description ?? "";
    l.features = input.features ?? [];
    l.isExportReady = !!input.isExportReady;
    l.isNew = input.condition === "New";
    if (input.images && input.images.length) {
      l.imageUrls = input.images.filter(Boolean);
      l.imageUrl = l.imageUrls[0] ?? l.imageUrl;
    }
    bust("listings");
    return { ok: true, id: l.id, slug: l.slug };
  }

  // ---- DB mode ----
  const [current] = await db
    .select({
      priceAED: listings.priceAED,
      sellerId: listings.sellerId,
      dealerId: listings.dealerId,
      slug: listings.slug,
    })
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);
  if (!current) return { ok: false, error: "Listing not found" };

  const owns =
    (!!current.sellerId && current.sellerId === user.id) ||
    (!!current.dealerId && current.dealerId === (await dealerIdForUser(user.id)));
  if (!owns) return { ok: false, error: "Not allowed" };

  const drivetrain = deriveDrivetrain({
    make: input.make,
    model: input.model,
    bodyType: input.bodyType ?? "",
  });
  const dealRating = await dealRatingFromDb(
    input.make,
    input.model,
    input.priceAED,
    id,
  );

  const priceChanged = current.priceAED !== input.priceAED;
  if (priceChanged) {
    await db
      .insert(priceHistory)
      .values({ listingId: id, oldPrice: current.priceAED, newPrice: input.priceAED });
  }

  await db
    .update(listings)
    .set({
      make: input.make,
      model: input.model,
      trim: input.trim,
      year: input.year,
      kms: input.kms,
      priceAED: input.priceAED,
      bodyType: input.bodyType,
      fuel: input.fuel,
      transmission: input.transmission,
      drivetrain,
      dealRating: dealRating ?? null,
      regionalSpec: input.regionalSpec,
      colorExterior: input.colorExterior,
      colorInterior: input.colorInterior,
      emirate: input.emirate,
      condition: input.condition,
      vin: input.vin,
      cylinders: input.cylinders,
      description: input.description,
      features: input.features ?? [],
      isExportReady: !!input.isExportReady,
      saleMode: input.saleMode ?? "retail",
      bulkMinQty: input.bulkMinQty ?? 5,
      stockQty: input.stockQty ?? 1,
      ...(priceChanged
        ? { previousPrice: current.priceAED, priceUpdatedAt: new Date() }
        : {}),
    })
    .where(eq(listings.id, id));

  // Replace the photo set only when the editor supplied images (an empty/omitted
  // array leaves the existing photos untouched rather than wiping them).
  if (input.images && input.images.length) {
    const images = input.images.filter(Boolean);
    await db.delete(listingMedia).where(eq(listingMedia.listingId, id));
    await db.insert(listingMedia).values(
      images.map((url, i) => ({
        listingId: id,
        url,
        type: "photo",
        isHero: i === 0,
        sortOrder: i,
      })),
    );
  }

  bust("listings");
  return { ok: true, id, slug: current.slug };
}
