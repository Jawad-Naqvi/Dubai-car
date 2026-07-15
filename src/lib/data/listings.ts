import "server-only";
import { unstable_cache } from "next/cache";
import {
  and,
  asc,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  not,
  or,
  sql,
} from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { listings, dealers, listingMedia, type Listing } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import {
  mockListings,
  type MockListing,
} from "@/lib/mock-data";
import { demoStore } from "./demo-store";

/** Public universe in demo mode: seeded mock cars + approved user-created cars. */
function demoUniverse(): MockListing[] {
  const approved = demoStore().newListings.filter(
    (l) => l.moderationStatus === "active",
  );
  return [...approved, ...mockListings];
}

export type SortKey =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "year_desc"
  | "kms_asc";

export interface ListingSearchParams {
  q?: string;
  make?: string[];
  model?: string[];
  bodyType?: string[];
  fuel?: string[];
  transmission?: string[];
  regionalSpec?: string[];
  emirate?: string[];
  condition?: string[];
  /** Exterior colour families (substring match against free-text colour). */
  color?: string[];
  interiorColor?: string[];
  cylinders?: number[];
  doors?: number[];
  /** "dealer" | "private" */
  sellerType?: string;
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  kmsMax?: number;
  exportReady?: boolean;
  inspected?: boolean;
  withPhotos?: boolean;
  featured?: boolean;
  dealerSlug?: string;
  dealerId?: string;
  sellerId?: string;
  status?: string;
  sort?: SortKey;
  page?: number;
  perPage?: number;
}

export interface ListingSearchResult {
  items: MockListing[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  facets: {
    makes: { value: string; count: number }[];
    models: { value: string; count: number }[];
    bodyTypes: { value: string; count: number }[];
    emirates: { value: string; count: number }[];
    fuels: { value: string; count: number }[];
    colors: { value: string; count: number }[];
    conditions: { value: string; count: number }[];
  };
}

const DEFAULT_PER_PAGE = 12;

/* ------------------------------------------------------------------ */
/* DB row -> MockListing shape (so every existing component just works) */
/* ------------------------------------------------------------------ */

type DbRow = {
  listing: Listing;
  dealerSlug: string | null;
  dealerName: string | null;
  dealerVerified: boolean | null;
  dealerRating: number | null;
  dealerReviews: number | null;
  heroUrl: string | null;
};

function rowToView(r: DbRow): MockListing {
  const l = r.listing;
  return {
    id: l.id,
    slug: l.slug,
    make: l.make,
    model: l.model,
    trim: l.trim ?? undefined,
    year: l.year,
    kms: l.kms,
    priceAED: l.priceAED,
    bodyType: l.bodyType ?? "—",
    fuel: l.fuel ?? "—",
    transmission: l.transmission ?? "—",
    regionalSpec: l.regionalSpec ?? "—",
    exteriorColor: l.colorExterior ?? "—",
    emirate: l.emirate,
    dealer: {
      id: l.dealerId ?? "private",
      slug: r.dealerSlug ?? "private-seller",
      name: r.dealerName ?? "Private Seller",
      isVerified: r.dealerVerified ?? false,
      rating: r.dealerRating ?? 0,
      reviewCount: r.dealerReviews ?? 0,
    },
    isFeatured: l.isFeatured,
    isInspected: l.isInspected,
    isExportReady: l.isExportReady,
    isNew: l.condition === "New",
    status: (l.status === "reserved" || l.status === "sold"
      ? l.status
      : "active") as MockListing["status"],
    imageUrl:
      r.heroUrl ||
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
    imageUrls: r.heroUrl ? [r.heroUrl] : [],
    description: l.description ?? "",
    features: (l.features as string[] | null) ?? [],
  };
}

/* ------------------------------------------------------------------ */
/* Mock-mode filtering (mirrors the DB query semantics 1:1)            */
/* ------------------------------------------------------------------ */

function matchMulti(value: string, selected?: string[]) {
  if (!selected || selected.length === 0) return true;
  return selected.some((s) => s.toLowerCase() === value.toLowerCase());
}

/** Colours are free-text, so match the selected family as a substring. */
function matchColor(value: string | undefined, families?: string[]) {
  if (!families || families.length === 0) return true;
  if (!value) return false;
  const v = value.toLowerCase();
  return families.some((f) => v.includes(f.toLowerCase()));
}

/** Bucket a free-text colour into a known family name for facet counts. */
function colorFamily(value: string | undefined, families: string[]) {
  if (!value) return undefined;
  const v = value.toLowerCase();
  return families.find((f) => v.includes(f.toLowerCase()));
}

const EXTERIOR_COLOR_FAMILIES = [
  "Black",
  "White",
  "Silver",
  "Grey",
  "Blue",
  "Red",
  "Green",
  "Brown",
  "Beige",
  "Gold",
  "Orange",
  "Yellow",
  "Purple",
];

/** New/Used/CPO. Mock rows only carry an isNew flag, so map accordingly. */
function matchCondition(l: MockListing, selected?: string[]) {
  if (!selected || selected.length === 0) return true;
  return selected.some((s) =>
    s === "New" ? l.isNew : !l.isNew,
  );
}

function matchSellerType(l: MockListing, sellerType?: string) {
  if (!sellerType) return true;
  const isPrivate =
    l.dealer.id === "private" || l.dealer.slug === "private-seller";
  return sellerType === "private" ? isPrivate : !isPrivate;
}

function filterMock(p: ListingSearchParams): MockListing[] {
  let items = demoUniverse().filter((l) => {
    if (p.q) {
      const hay =
        `${l.year} ${l.make} ${l.model} ${l.trim ?? ""} ${l.exteriorColor} ${l.bodyType} ${l.description} ${(l.features ?? []).join(" ")}`.toLowerCase();
      if (!hay.includes(p.q.toLowerCase())) return false;
    }
    if (!matchMulti(l.make, p.make)) return false;
    if (!matchMulti(l.model, p.model)) return false;
    if (!matchMulti(l.bodyType, p.bodyType)) return false;
    if (!matchMulti(l.fuel, p.fuel)) return false;
    if (!matchMulti(l.transmission, p.transmission)) return false;
    if (!matchMulti(l.regionalSpec, p.regionalSpec)) return false;
    if (!matchMulti(l.emirate, p.emirate)) return false;
    if (!matchCondition(l, p.condition)) return false;
    if (!matchColor(l.exteriorColor, p.color)) return false;
    if (!matchSellerType(l, p.sellerType)) return false;
    if (p.priceMin != null && l.priceAED < p.priceMin) return false;
    if (p.priceMax != null && l.priceAED > p.priceMax) return false;
    if (p.yearMin != null && l.year < p.yearMin) return false;
    if (p.yearMax != null && l.year > p.yearMax) return false;
    if (p.kmsMax != null && l.kms > p.kmsMax) return false;
    if (p.exportReady && !l.isExportReady) return false;
    if (p.inspected && !l.isInspected) return false;
    if (p.withPhotos && !(l.imageUrl || (l.imageUrls?.length ?? 0) > 0))
      return false;
    if (p.featured && !l.isFeatured) return false;
    if (p.dealerSlug && l.dealer.slug !== p.dealerSlug) return false;
    if (p.dealerId && l.dealer.id !== p.dealerId) return false;
    return true;
  });

  switch (p.sort) {
    case "price_asc":
      items = items.sort((a, b) => a.priceAED - b.priceAED);
      break;
    case "price_desc":
      items = items.sort((a, b) => b.priceAED - a.priceAED);
      break;
    case "year_desc":
      items = items.sort((a, b) => b.year - a.year);
      break;
    case "kms_asc":
      items = items.sort((a, b) => a.kms - b.kms);
      break;
    default:
      // "newest" — featured first, then keep declared order
      items = items.sort(
        (a, b) => Number(b.isFeatured) - Number(a.isFeatured),
      );
  }
  return items;
}

function facetCounts(items: MockListing[], key: (l: MockListing) => string) {
  const map = new Map<string, number>();
  for (const l of items) map.set(key(l), (map.get(key(l)) ?? 0) + 1);
  return Array.from(map.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Cached search. DB reads are wrapped in the Next.js data cache (tag
 * "listings") so repeat browse hits don't round-trip to the database — writes
 * call revalidateTag("listings") to keep results real-time fresh. Demo mode is
 * already in-memory, so it skips the cache.
 */
const cachedSearch = unstable_cache(
  (p: ListingSearchParams) => runSearchListings(p),
  ["search-listings"],
  { revalidate: 120, tags: ["listings"] },
);

export async function searchListings(
  p: ListingSearchParams = {},
): Promise<ListingSearchResult> {
  if (!isDbEnabled()) return runSearchListings(p);
  return cachedSearch(p);
}

async function runSearchListings(
  p: ListingSearchParams = {},
): Promise<ListingSearchResult> {
  const page = Math.max(1, p.page ?? 1);
  const perPage = p.perPage ?? DEFAULT_PER_PAGE;

  if (!isDbEnabled()) {
    const all = filterMock(p);
    const total = all.length;
    const start = (page - 1) * perPage;
    const items = all.slice(start, start + perPage);
    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
      facets: {
        makes: facetCounts(filterMock({ ...p, make: undefined }), (l) => l.make),
        models: facetCounts(
          filterMock({ ...p, model: undefined }),
          (l) => l.model,
        ),
        bodyTypes: facetCounts(
          filterMock({ ...p, bodyType: undefined }),
          (l) => l.bodyType,
        ),
        emirates: facetCounts(
          filterMock({ ...p, emirate: undefined }),
          (l) => l.emirate,
        ),
        fuels: facetCounts(filterMock({ ...p, fuel: undefined }), (l) => l.fuel),
        colors: facetCounts(
          filterMock({ ...p, color: undefined }).filter((l) =>
            colorFamily(l.exteriorColor, EXTERIOR_COLOR_FAMILIES),
          ),
          (l) => colorFamily(l.exteriorColor, EXTERIOR_COLOR_FAMILIES)!,
        ),
        conditions: facetCounts(
          filterMock({ ...p, condition: undefined }),
          (l) => (l.isNew ? "New" : "Used"),
        ),
      },
    };
  }

  // ---- DB mode ----
  // Resolve a dealer slug to its id so the slug filter works in SQL.
  let resolved = p;
  if (p.dealerSlug && !p.dealerId) {
    const d = await db
      .select({ id: dealers.id })
      .from(dealers)
      .where(eq(dealers.slug, p.dealerSlug))
      .limit(1);
    resolved = { ...p, dealerId: d[0]?.id ?? "00000000-0000-0000-0000-000000000000" };
  }
  const conds = buildConditions(resolved);

  const orderBy = (() => {
    switch (p.sort) {
      case "price_asc":
        return asc(listings.priceAED);
      case "price_desc":
        return desc(listings.priceAED);
      case "year_desc":
        return desc(listings.year);
      case "kms_asc":
        return asc(listings.kms);
      default:
        return [desc(listings.isFeatured), desc(listings.publishedAt)];
    }
  })();

  const hero = db.$with("hero").as(
    db
      .select({
        listingId: listingMedia.listingId,
        url: sql<string>`min(${listingMedia.url})`.as("hero_url"),
      })
      .from(listingMedia)
      .where(eq(listingMedia.isHero, true))
      .groupBy(listingMedia.listingId),
  );

  const base = db
    .with(hero)
    .select({
      listing: listings,
      dealerSlug: dealers.slug,
      dealerName: dealers.businessName,
      dealerVerified: dealers.isVerified,
      dealerRating: dealers.rating,
      dealerReviews: dealers.reviewCount,
      heroUrl: hero.url,
    })
    .from(listings)
    .leftJoin(dealers, eq(listings.dealerId, dealers.id))
    .leftJoin(hero, eq(hero.listingId, listings.id))
    .where(and(...conds));

  const rows = (await base
    .orderBy(...(Array.isArray(orderBy) ? orderBy : [orderBy]))
    .limit(perPage)
    .offset((page - 1) * perPage)) as DbRow[];

  const countRows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(listings)
    .where(and(...conds));
  const total = countRows[0]?.c ?? 0;

  /**
   * Each facet is counted with its OWN filter excluded, so picking "Toyota"
   * still shows how many BMWs you'd get if you switched — the way cars.com and
   * every mature faceted search behaves. Counting with the full condition set
   * would collapse each list to just the selected value.
   */
  const facetFor = async (
    key: keyof ListingSearchParams,
    column: PgColumn,
  ): Promise<{ value: string; count: number }[]> => {
    const rows = (await db
      .select({ value: column, count: sql<number>`count(*)::int` })
      .from(listings)
      .where(and(...buildConditions({ ...resolved, [key]: undefined })))
      .groupBy(column)) as { value: string | null; count: number }[];
    return rows
      .filter((r) => Boolean(r.value))
      .map((r) => ({ value: r.value as string, count: r.count }))
      .sort((a, b) => b.count - a.count);
  };

  const [makes, models, bodyTypesF, emiratesF, fuels, colorRows, conditionsF] =
    await Promise.all([
      facetFor("make", listings.make),
      facetFor("model", listings.model),
      facetFor("bodyType", listings.bodyType),
      facetFor("emirate", listings.emirate),
      facetFor("fuel", listings.fuel),
      facetFor("color", listings.colorExterior),
      facetFor("condition", listings.condition),
    ]);

  // Free-text colors ("Nardo Grey") roll up into the swatch families.
  const colorMap = new Map<string, number>();
  for (const r of colorRows) {
    const fam = colorFamily(r.value, EXTERIOR_COLOR_FAMILIES);
    if (fam) colorMap.set(fam, (colorMap.get(fam) ?? 0) + r.count);
  }
  const colors = Array.from(colorMap, ([value, count]) => ({ value, count })).sort(
    (a, b) => b.count - a.count,
  );

  return {
    items: rows.map(rowToView),
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
    facets: {
      makes,
      models,
      bodyTypes: bodyTypesF,
      emirates: emiratesF,
      fuels,
      colors,
      conditions: conditionsF,
    },
  };
}

function buildConditions(p: ListingSearchParams) {
  const conds = [];
  conds.push(eq(listings.status, (p.status as Listing["status"]) ?? "active"));
  if (p.q) {
    const term = `%${p.q}%`;
    conds.push(
      or(
        ilike(listings.make, term),
        ilike(listings.model, term),
        ilike(listings.trim, term),
        ilike(listings.colorExterior, term),
        ilike(listings.bodyType, term),
        ilike(listings.description, term),
        sql`${listings.features}::text ilike ${term}`,
      )!,
    );
  }
  if (p.make?.length) conds.push(inArray(listings.make, p.make));
  if (p.model?.length) conds.push(inArray(listings.model, p.model));
  if (p.bodyType?.length) conds.push(inArray(listings.bodyType, p.bodyType));
  if (p.fuel?.length) conds.push(inArray(listings.fuel, p.fuel));
  if (p.transmission?.length)
    conds.push(inArray(listings.transmission, p.transmission));
  if (p.regionalSpec?.length)
    conds.push(inArray(listings.regionalSpec, p.regionalSpec));
  if (p.emirate?.length) conds.push(inArray(listings.emirate, p.emirate));
  if (p.condition?.length) conds.push(inArray(listings.condition, p.condition));
  if (p.color?.length) {
    conds.push(
      or(
        ...p.color.map((c) => ilike(listings.colorExterior, `%${c}%`)),
      )!,
    );
  }
  if (p.interiorColor?.length) {
    conds.push(
      or(
        ...p.interiorColor.map((c) => ilike(listings.colorInterior, `%${c}%`)),
      )!,
    );
  }
  if (p.cylinders?.length) conds.push(inArray(listings.cylinders, p.cylinders));
  if (p.doors?.length) conds.push(inArray(listings.doors, p.doors));
  if (p.sellerType === "private") conds.push(isNull(listings.dealerId));
  if (p.sellerType === "dealer") conds.push(not(isNull(listings.dealerId)));
  if (p.withPhotos)
    conds.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(listingMedia)
          .where(eq(listingMedia.listingId, listings.id)),
      ),
    );
  if (p.priceMin != null) conds.push(gte(listings.priceAED, p.priceMin));
  if (p.priceMax != null) conds.push(lte(listings.priceAED, p.priceMax));
  if (p.yearMin != null) conds.push(gte(listings.year, p.yearMin));
  if (p.yearMax != null) conds.push(lte(listings.year, p.yearMax));
  if (p.kmsMax != null) conds.push(lte(listings.kms, p.kmsMax));
  if (p.exportReady) conds.push(eq(listings.isExportReady, true));
  if (p.inspected) conds.push(eq(listings.isInspected, true));
  if (p.featured) conds.push(eq(listings.isFeatured, true));
  if (p.dealerId) conds.push(eq(listings.dealerId, p.dealerId));
  if (p.sellerId) conds.push(eq(listings.sellerId, p.sellerId));
  return conds;
}

const cachedGetById = unstable_cache(
  (id: string) => runGetListingById(id),
  ["listing-by-id"],
  { revalidate: 120, tags: ["listings"] },
);

export async function getListingById(id: string): Promise<MockListing | null> {
  if (!isDbEnabled()) {
    return (
      demoStore().newListings.find((l) => l.id === id) ??
      mockListings.find((l) => l.id === id) ??
      null
    );
  }
  return cachedGetById(id);
}

async function runGetListingById(id: string): Promise<MockListing | null> {
  const hero = db.$with("hero").as(
    db
      .select({
        listingId: listingMedia.listingId,
        url: sql<string>`min(${listingMedia.url})`.as("hero_url"),
      })
      .from(listingMedia)
      .where(eq(listingMedia.isHero, true))
      .groupBy(listingMedia.listingId),
  );
  const rows = (await db
    .with(hero)
    .select({
      listing: listings,
      dealerSlug: dealers.slug,
      dealerName: dealers.businessName,
      dealerVerified: dealers.isVerified,
      dealerRating: dealers.rating,
      dealerReviews: dealers.reviewCount,
      heroUrl: hero.url,
    })
    .from(listings)
    .leftJoin(dealers, eq(listings.dealerId, dealers.id))
    .leftJoin(hero, eq(hero.listingId, listings.id))
    .where(eq(listings.id, id))
    .limit(1)) as DbRow[];
  return rows[0] ? rowToView(rows[0]) : null;
}

export async function getListingsByIds(ids: string[]): Promise<MockListing[]> {
  if (ids.length === 0) return [];
  if (!isDbEnabled()) {
    const universe = [...demoStore().newListings, ...mockListings];
    return ids
      .map((id) => universe.find((l) => l.id === id))
      .filter(Boolean) as MockListing[];
  }
  const byId = await Promise.all(ids.map((id) => getListingById(id)));
  return byId.filter(Boolean) as MockListing[];
}

const cachedMedia = unstable_cache(
  async (id: string) => {
    const media = await db
      .select({ url: listingMedia.url })
      .from(listingMedia)
      .where(eq(listingMedia.listingId, id))
      .orderBy(asc(listingMedia.sortOrder));
    return media.map((m) => m.url);
  },
  ["listing-media"],
  { revalidate: 300, tags: ["listings"] },
);

export async function getListingMedia(id: string): Promise<string[]> {
  if (!isDbEnabled()) {
    const found = await getListingById(id);
    return found?.imageUrls ?? [];
  }
  return cachedMedia(id);
}

export async function getSimilarListings(
  listing: MockListing,
  limit = 4,
): Promise<MockListing[]> {
  const res = await searchListings({
    make: [listing.make],
    perPage: limit + 1,
  });
  const same = res.items.filter((l) => l.id !== listing.id);
  if (same.length >= limit) return same.slice(0, limit);
  // backfill by body type
  const more = await searchListings({
    bodyType: [listing.bodyType],
    perPage: limit + 4,
  });
  const merged = [...same];
  for (const m of more.items) {
    if (m.id !== listing.id && !merged.find((x) => x.id === m.id))
      merged.push(m);
    if (merged.length >= limit) break;
  }
  return merged.slice(0, limit);
}

export async function getFeaturedListings(limit = 6): Promise<MockListing[]> {
  const res = await searchListings({ featured: true, perPage: limit });
  if (res.items.length >= limit) return res.items;
  const fill = await searchListings({ perPage: limit });
  const merged = [...res.items];
  for (const l of fill.items) {
    if (!merged.find((x) => x.id === l.id)) merged.push(l);
    if (merged.length >= limit) break;
  }
  return merged.slice(0, limit);
}

export async function incrementViewCount(id: string): Promise<void> {
  if (!isDbEnabled()) return;
  await db
    .update(listings)
    .set({ viewCount: sql`${listings.viewCount} + 1` })
    .where(eq(listings.id, id));
}
