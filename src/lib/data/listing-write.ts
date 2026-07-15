import "server-only";
import { z } from "zod";
import { eq, sql, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings, listingMedia, dealers } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { slugify } from "@/lib/utils";
import { deriveDrivetrain, computeDealRating } from "@/lib/vehicle-derive";
import { demoStore, demoId, type DemoListing } from "./demo-store";
import { bust } from "./revalidate";
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
  if (user) {
    const d = await db
      .select({ id: dealers.id })
      .from(dealers)
      .where(eq(dealers.userId, user.id))
      .limit(1);
    dealerId = d[0]?.id;
  }

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
      status: "pending_review",
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
  return { id: row.id, slug: row.slug, status: "pending_review" };
}
