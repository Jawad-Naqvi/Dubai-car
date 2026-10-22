import "server-only";
import { unstable_cache } from "next/cache";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { dealers, listings } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { mockDealers } from "@/lib/mock-data";
import { getActiveMarketCode } from "@/lib/market-active";

export interface DealerView {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string;
  coverUrl: string;
  emirate: string;
  rating: number;
  reviewCount: number;
  listingCount: number;
  isVerified: boolean;
  isFeatured: boolean;
  subscriptionTier?: string;
  phone?: string;
  whatsapp?: string;
  description?: string;
  address?: string;
}

const cachedDealers = unstable_cache(
  (countryCode: string) => runGetDealers(countryCode),
  ["all-dealers"],
  { revalidate: 300, tags: ["dealers"] },
);

export async function getDealers(): Promise<DealerView[]> {
  if (!isDbEnabled()) {
    // Mock dealers are all UAE; a non-AE market shows none in demo mode.
    const code = await getActiveMarketCode();
    if (code !== "AE") return [];
    return mockDealers.map((d) => ({ ...d, tagline: d.tagline }));
  }
  return cachedDealers(await getActiveMarketCode());
}

async function runGetDealers(countryCode: string): Promise<DealerView[]> {
  const rows = await db
    .select({
      dealer: dealers,
      listingCount: sql<number>`count(${listings.id})::int`,
    })
    .from(dealers)
    .leftJoin(
      listings,
      sql`${listings.dealerId} = ${dealers.id} and ${listings.status} = 'active'`,
    )
    .where(eq(dealers.countryCode, countryCode))
    .groupBy(dealers.id)
    .orderBy(desc(dealers.isFeatured), desc(dealers.rating));

  return rows.map((r) => ({
    id: r.dealer.id,
    slug: r.dealer.slug,
    name: r.dealer.businessName,
    tagline: r.dealer.tagline ?? "",
    logoUrl: r.dealer.logoUrl ?? "",
    coverUrl: r.dealer.coverUrl ?? "",
    emirate: r.dealer.emirate,
    rating: r.dealer.rating ?? 0,
    reviewCount: r.dealer.reviewCount ?? 0,
    listingCount: r.listingCount,
    isVerified: r.dealer.isVerified,
    isFeatured: r.dealer.isFeatured,
    subscriptionTier: r.dealer.subscriptionTier,
    phone: r.dealer.phone ?? undefined,
    whatsapp: r.dealer.whatsapp ?? undefined,
    description: r.dealer.description ?? undefined,
    address: r.dealer.address ?? undefined,
  }));
}

const cachedDealerBySlug = unstable_cache(
  (slug: string) => runGetDealerBySlug(slug),
  ["dealer-by-slug"],
  { revalidate: 300, tags: ["dealers"] },
);

export async function getDealerBySlug(
  slug: string,
): Promise<DealerView | null> {
  if (!isDbEnabled()) {
    const d = mockDealers.find((x) => x.slug === slug);
    return d ? { ...d } : null;
  }
  return cachedDealerBySlug(slug);
}

async function runGetDealerBySlug(
  slug: string,
): Promise<DealerView | null> {
  const rows = await db
    .select({
      dealer: dealers,
      listingCount: sql<number>`count(${listings.id})::int`,
    })
    .from(dealers)
    .leftJoin(
      listings,
      sql`${listings.dealerId} = ${dealers.id} and ${listings.status} = 'active'`,
    )
    .where(eq(dealers.slug, slug))
    .groupBy(dealers.id)
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.dealer.id,
    slug: r.dealer.slug,
    name: r.dealer.businessName,
    tagline: r.dealer.tagline ?? "",
    logoUrl: r.dealer.logoUrl ?? "",
    coverUrl: r.dealer.coverUrl ?? "",
    emirate: r.dealer.emirate,
    rating: r.dealer.rating ?? 0,
    reviewCount: r.dealer.reviewCount ?? 0,
    listingCount: r.listingCount,
    isVerified: r.dealer.isVerified,
    isFeatured: r.dealer.isFeatured,
    subscriptionTier: r.dealer.subscriptionTier,
    phone: r.dealer.phone ?? undefined,
    whatsapp: r.dealer.whatsapp ?? undefined,
    description: r.dealer.description ?? undefined,
    address: r.dealer.address ?? undefined,
  };
}
