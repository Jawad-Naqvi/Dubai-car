import "server-only";
import { z } from "zod";
import { eq, sql, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings, listingMedia, dealers, priceHistory } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
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
  priceAED: z.coerce.number().int().min(1000).max(50_000_000),
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
): Promise<CreateListingResult> {
  const input = listingInputSchema.parse(raw);
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
      isNew: input.condition === "New",
      status: "active",
      imageUrl:
        images[0] ||
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
      imageUrls: images,
      description: input.description ?? "",
      features: input.features ?? [],
      moderationStatus: "pending_review",
      ownerUserId: user?.id,
      createdAt: new Date().toISOString(),
      viewCount: 0,
      inquiryCount: 0,
    };
    store.newListings.unshift(listing);
    bust("listings");
    return { id: listing.id, slug, status: "pending_review" };
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
  const idOnFile = !!user?.emiratesIdNumber;
  if (!dealerVerified && !idOnFile) {
    throw new Error(
      "Please verify your Emirates ID before listing a car.",
    );
  }

  // KYC-approved dealers publish instantly — moderation is for unvetted
  // sellers (private listings, or dealers still pending approval).
  const initialStatus = dealerVerified ? "active" : "pending_review";

  // Individual per-listing fee (default OFF during the free launch). When on,
  // a private-seller listing is held as an unpaid "draft" and the caller is
  // told a fee is due; the Stripe webhook flips it to pending_review on payment.
  // Dealers (any dealerId) are exempt — their listings are covered by their tier.
  const feeApplies = isListingFeeEnabled() && !dealerId;
  const feeAED = feeApplies ? computeListingFee(input.priceAED) : 0;
  const finalStatus = feeApplies ? "draft" : initialStatus;

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
