import "server-only";
import { desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings, listingMedia, leads, type Listing } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { mockListings } from "@/lib/mock-data";
import { demoStore } from "./demo-store";
import { getEffectiveDealer, getOrSyncUser, dashboardsOpen } from "./users";
import { bust } from "./revalidate";
import { subscriptionTiers } from "@/lib/brand";

/** The mock dealer we treat as "you" in demo mode (no real dealer identity). */
const PRIMARY_DEMO_DEALER = "al-futtaim-motors";

export interface InventoryRow {
  id: string;
  slug: string;
  title: string;
  trim?: string;
  priceAED: number;
  year: number;
  kms: number;
  emirate: string;
  imageUrl: string;
  status: string; // active | pending_review | reserved | sold | archived | rejected
  isFeatured: boolean;
  isExportReady: boolean;
  viewCount: number;
  inquiryCount: number;
  createdAt?: string;
}

export interface DealerContext {
  name: string;
  tier: string;
  tierName: string;
  monthlyAED: number;
  listingQuota: number;
  listingsUsed: number;
}

// Deterministic pseudo-metrics so demo numbers are stable across renders.
function hashNum(s: string, mod: number, min: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % mod) + min;
}

export async function getDealerContext(): Promise<DealerContext> {
  if (!isDbEnabled()) {
    const store = demoStore();
    const created = store.newListings.length;
    const tier =
      subscriptionTiers.find((t) => t.id === store.currentTier) ??
      subscriptionTiers.find((t) => t.id === "gold")!;
    return {
      name: "Al Futtaim Motors",
      tier: tier.id,
      tierName: tier.name,
      monthlyAED: tier.monthlyAED,
      listingQuota: tier.listings,
      listingsUsed:
        mockListings.filter((l) => l.dealer.slug === PRIMARY_DEMO_DEALER).length +
        created,
    };
  }
  const dealer = await getEffectiveDealer();
  const tierId = dealer?.subscriptionTier ?? "free";
  const tier =
    subscriptionTiers.find((t) => t.id === tierId) ?? subscriptionTiers[0];
  let used = dealer?.listingQuotaUsed ?? 0;
  if (dealer) {
    const c = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(listings)
      .where(eq(listings.dealerId, dealer.id));
    used = c[0]?.c ?? used;
  }
  return {
    name: dealer?.businessName ?? "Your dealership",
    tier: tierId,
    tierName: tier.name,
    monthlyAED: tier.monthlyAED,
    listingQuota: tier.listings,
    listingsUsed: used,
  };
}

export async function getDealerInventory(): Promise<InventoryRow[]> {
  if (!isDbEnabled()) {
    const created: InventoryRow[] = demoStore().newListings.map((l) => ({
      id: l.id,
      slug: l.slug,
      title: `${l.year} ${l.make} ${l.model}`,
      trim: l.trim,
      priceAED: l.priceAED,
      year: l.year,
      kms: l.kms,
      emirate: l.emirate,
      imageUrl: l.imageUrl,
      status: l.moderationStatus,
      isFeatured: l.isFeatured,
      isExportReady: l.isExportReady,
      viewCount: l.viewCount,
      inquiryCount: l.inquiryCount,
      createdAt: l.createdAt,
    }));
    const owned: InventoryRow[] = mockListings
      .filter((l) => l.dealer.slug === PRIMARY_DEMO_DEALER)
      .map((l) => ({
        id: l.id,
        slug: l.slug,
        title: `${l.year} ${l.make} ${l.model}`,
        trim: l.trim,
        priceAED: l.priceAED,
        year: l.year,
        kms: l.kms,
        emirate: l.emirate,
        imageUrl: l.imageUrl,
        status: l.status,
        isFeatured: l.isFeatured,
        isExportReady: l.isExportReady,
        viewCount: hashNum(l.id, 2400, 320),
        inquiryCount: hashNum(l.id + "i", 40, 3),
      }));
    return [...created, ...owned];
  }

  const dealer = await getEffectiveDealer();
  const user = await getOrSyncUser();
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
  const ownerConds = [];
  if (dealer) ownerConds.push(eq(listings.dealerId, dealer.id));
  if (user) ownerConds.push(eq(listings.sellerId, user.id));
  // In testing mode (OPEN_DASHBOARDS), also surface guest-created listings that
  // aren't tied to any dealer/seller, so what you list shows up here.
  if (dashboardsOpen())
    ownerConds.push(sql`(${listings.dealerId} is null and ${listings.sellerId} is null)`);
  const cond = ownerConds.length ? or(...ownerConds) : sql`false`;

  const rows = await db
    .with(hero)
    .select({ listing: listings, heroUrl: hero.url })
    .from(listings)
    .leftJoin(hero, eq(hero.listingId, listings.id))
    .where(cond)
    .orderBy(desc(listings.createdAt))
    .limit(200);

  return rows.map(({ listing: l, heroUrl }) => ({
    id: l.id,
    slug: l.slug,
    title: `${l.year} ${l.make} ${l.model}`,
    trim: l.trim ?? undefined,
    priceAED: l.priceAED,
    year: l.year,
    kms: l.kms,
    emirate: l.emirate,
    imageUrl:
      heroUrl ||
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
    status: l.status,
    isFeatured: l.isFeatured,
    isExportReady: l.isExportReady,
    viewCount: l.viewCount,
    inquiryCount: l.inquiryCount,
    createdAt: l.createdAt.toISOString(),
  }));
}

export interface DashboardStats {
  activeListings: number;
  totalViews: number;
  totalLeads: number;
  revenueMonth: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const inventory = await getDealerInventory();
  const active = inventory.filter((l) => l.status === "active").length;
  const views = inventory.reduce((s, l) => s + l.viewCount, 0);

  if (!isDbEnabled()) {
    const ctx = await getDealerContext();
    const leadCount = demoStore().leads.length;
    return {
      activeListings: active,
      totalViews: views,
      totalLeads: leadCount,
      revenueMonth: ctx.monthlyAED + leadCount * 50,
    };
  }
  const dealer = await getEffectiveDealer();
  const leadRows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(leads)
    .where(dealer ? eq(leads.dealerId, dealer.id) : sql`false`);
  const ctx = await getDealerContext();
  return {
    activeListings: active,
    totalViews: views,
    totalLeads: leadRows[0]?.c ?? 0,
    revenueMonth: ctx.monthlyAED,
  };
}

/** Update listing status (mark sold / reserved / archived / feature toggle). */
export async function updateListingStatus(
  id: string,
  patch: { status?: string; isFeatured?: boolean },
): Promise<boolean> {
  if (!isDbEnabled()) {
    const store = demoStore();
    const l = store.newListings.find((x) => x.id === id);
    if (l) {
      if (patch.status) {
        if (patch.status === "active") l.moderationStatus = "active";
        else if (patch.status === "archived") l.moderationStatus = "archived";
        else l.status = patch.status as typeof l.status;
      }
      if (patch.isFeatured != null) l.isFeatured = patch.isFeatured;
      bust("listings");
      return true;
    }
    return true; // mock-owned rows: accept no-op so the UI flow works
  }
  await db
    .update(listings)
    .set({
      ...(patch.status ? { status: patch.status as Listing["status"] } : {}),
      ...(patch.isFeatured != null ? { isFeatured: patch.isFeatured } : {}),
      ...(patch.status === "sold" ? { soldAt: new Date() } : {}),
    })
    .where(eq(listings.id, id));
  bust("listings");
  return true;
}

export async function deleteListing(id: string): Promise<boolean> {
  if (!isDbEnabled()) {
    const store = demoStore();
    store.newListings = store.newListings.filter((x) => x.id !== id);
    bust("listings");
    return true;
  }
  await db.delete(listings).where(eq(listings.id, id));
  bust("listings");
  return true;
}
