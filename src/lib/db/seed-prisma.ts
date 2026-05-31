/**
 * Seeds the Neon/AWS RDS DB with the mock dealers + listings using Prisma ORM.
 * Run with: npm run prisma:seed
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { mockDealers, mockListings } from "../mock-data";

const prisma = new PrismaClient();

async function main() {
  console.log("⛁  Seeding DXB Motors database via Prisma ORM…");

  // Clear existing data to allow safe, repeated runs
  console.log("   Clearing existing data from tables...");
  await prisma.listingMedia.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.dealer.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create a placeholder admin + dealer user per mock dealer
  console.log("   Creating Users...");
  const insertedUsers = [];
  for (let i = 0; i < mockDealers.length; i++) {
    const d = mockDealers[i];
    const u = await prisma.user.create({
      data: {
        clerkId: `seed_dealer_${d.id}`,
        email: `dealer${i + 1}@${d.slug}.ae`,
        name: d.name,
        role: "dealer",
      },
    });
    insertedUsers.push(u);
  }
  console.log(`   ✓ Users: ${insertedUsers.length}`);

  // 2. Create Dealers
  console.log("   Creating Dealers...");
  const insertedDealers = [];
  for (let i = 0; i < mockDealers.length; i++) {
    const d = mockDealers[i];
    const tier =
      i % 3 === 0
        ? ("platinum" as const)
        : i % 3 === 1
        ? ("gold" as const)
        : ("silver" as const);

    const dealer = await prisma.dealer.create({
      data: {
        userId: insertedUsers[i].id,
        slug: d.slug,
        businessName: d.name,
        logoUrl: d.logoUrl,
        tagline: d.tagline,
        emirate: d.emirate,
        subscriptionTier: tier,
        isVerified: d.isVerified,
        isFeatured: d.isFeatured,
        rating: d.rating,
        reviewCount: d.reviewCount,
        verifiedAt: new Date(),
      },
    });
    insertedDealers.push(dealer);
  }
  console.log(`   ✓ Dealers: ${insertedDealers.length}`);

  const dealerBySlug = new Map(insertedDealers.map((d) => [d.slug, d]));

  // 3. Create Listings & Media in parallel or sequence
  console.log("   Creating Listings and Media...");
  let listingCount = 0;
  let mediaCount = 0;

  for (let i = 0; i < mockListings.length; i++) {
    const l = mockListings[i];
    const d = dealerBySlug.get(l.dealer.slug);
    if (!d) continue;

    const listing = await prisma.listing.create({
      data: {
        slug: l.slug,
        dealerId: d.id,
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
        priceAED: BigInt(l.priceAED), // Map priceAED correctly as BigInt
        description: l.description,
        features: l.features, // JSON type maps correctly
        emirate: l.emirate,
        status: "active",
        isExportReady: l.isExportReady,
        isFeatured: l.isFeatured,
        isInspected: l.isInspected,
        publishedAt: new Date(),
      },
    });
    listingCount++;

    // Add media row (hero photo)
    await prisma.listingMedia.create({
      data: {
        listingId: listing.id,
        url: l.imageUrl,
        type: "photo",
        isHero: true,
        sortOrder: 0,
      },
    });
    mediaCount++;
  }

  console.log(`   ✓ Listings inserted: ${listingCount}`);
  console.log(`   ✓ Media rows inserted: ${mediaCount}`);
  console.log("✅  Prisma Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
