/**
 * Seeds the Neon DB with the same mock dealers + listings used during development.
 * Run with: pnpm db:seed
 */
import "dotenv/config";
import { db } from "./index";
import { users, dealers, listings, listingMedia } from "./schema";
import { mockDealers, mockListings } from "../mock-data";

async function main() {
  console.log("⛁  Seeding DXB Motors database…");

  // 1. Create a placeholder admin + dealer user per mock dealer
  const insertedUsers = await db
    .insert(users)
    .values(
      mockDealers.map((d, i) => ({
        clerkId: `seed_dealer_${d.id}`,
        email: `dealer${i + 1}@${d.slug}.ae`,
        name: d.name,
        role: "dealer" as const,
      })),
    )
    .returning();
  console.log(`   ✓ Users: ${insertedUsers.length}`);

  // 2. Dealers
  const insertedDealers = await db
    .insert(dealers)
    .values(
      mockDealers.map((d, i) => ({
        userId: insertedUsers[i].id,
        slug: d.slug,
        businessName: d.name,
        logoUrl: d.logoUrl,
        tagline: d.tagline,
        emirate: d.emirate,
        subscriptionTier:
          i % 3 === 0 ? ("platinum" as const) : i % 3 === 1 ? ("gold" as const) : ("silver" as const),
        isVerified: d.isVerified,
        isFeatured: d.isFeatured,
        rating: d.rating,
        reviewCount: d.reviewCount,
        verifiedAt: new Date(),
      })),
    )
    .returning();
  console.log(`   ✓ Dealers: ${insertedDealers.length}`);

  const dealerBySlug = new Map(insertedDealers.map((d) => [d.slug, d]));

  // 3. Listings
  const insertedListings = await db
    .insert(listings)
    .values(
      mockListings.map((l) => ({
        slug: l.slug,
        dealerId: dealerBySlug.get(l.dealer.slug)?.id,
        make: l.make,
        model: l.model,
        trim: l.trim,
        year: l.year,
        bodyType: l.bodyType,
        fuel: l.fuel,
        transmission: l.transmission,
        kms: l.kms,
        colorExterior: l.exteriorColor,
        regionalSpec: l.regionalSpec,
        priceAED: l.priceAED,
        description: l.description,
        features: l.features,
        emirate: l.emirate,
        status: "active" as const,
        isExportReady: l.isExportReady,
        isFeatured: l.isFeatured,
        isInspected: l.isInspected,
        publishedAt: new Date(),
      })),
    )
    .returning();
  console.log(`   ✓ Listings: ${insertedListings.length}`);

  // 4. Media (single hero photo per listing for now)
  await db.insert(listingMedia).values(
    insertedListings.map((l, i) => ({
      listingId: l.id,
      url: mockListings[i].imageUrl,
      type: "photo",
      isHero: true,
      sortOrder: 0,
    })),
  );
  console.log(`   ✓ Media rows inserted`);

  console.log("✅  Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
