import "server-only";
import { desc, eq, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  listings,
  listingMedia,
  leads,
  listingViewEvents,
  type Listing,
} from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { mockListings } from "@/lib/mock-data";
import { demoStore } from "./demo-store";
import { getEffectiveDealer, getOrSyncUser } from "./users";
import { bust } from "./revalidate";
import { subscriptionTiers } from "@/lib/brand";
import { getQuotesForDealer } from "./quotes";
import { getOrdersForDealer } from "./orders";
import { getLeadsForDealer } from "./leads";

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
  bodyType: string;
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
  /** KYC review state — drives the "verification pending" banner. */
  kycStatus: "pending" | "approved" | "rejected";
  isVerified: boolean;
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
      kycStatus: "approved",
      isVerified: true,
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
    kycStatus: dealer?.kycStatus ?? "pending",
    isVerified: dealer?.isVerified ?? false,
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
      bodyType: l.bodyType,
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
        bodyType: l.bodyType,
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
  // Strict per-owner scoping: a dealer sees ONLY listings tied to their own
  // dealer record or their own user id. No guest/unclaimed-listing fallback —
  // that previously leaked null-owner listings into every dealer's inventory.
  const ownerConds = [];
  if (dealer) ownerConds.push(eq(listings.dealerId, dealer.id));
  if (user) ownerConds.push(eq(listings.sellerId, user.id));
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
    bodyType: l.bodyType ?? "—",
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

/**
 * Listings a signed-in BUYER has submitted themselves via /sell/new (private
 * seller, no dealer account) — scoped strictly by sellerId/ownerUserId, with
 * NO dealer fallback and NO "unclaimed listing" fallback. This is
 * intentionally separate from getDealerInventory/getEffectiveDealer, which
 * are dealer-role concepts and must never leak another dealer's inventory
 * into a buyer's "my listings" view.
 */
export async function getSellerListings(userId: string): Promise<InventoryRow[]> {
  if (!isDbEnabled()) {
    return demoStore()
      .newListings.filter((l) => l.ownerUserId === userId)
      .map((l) => ({
        id: l.id,
        slug: l.slug,
        title: `${l.year} ${l.make} ${l.model}`,
        trim: l.trim,
        priceAED: l.priceAED,
        year: l.year,
        kms: l.kms,
        emirate: l.emirate,
        bodyType: l.bodyType,
        imageUrl: l.imageUrl,
        status: l.moderationStatus,
        isFeatured: l.isFeatured,
        isExportReady: l.isExportReady,
        viewCount: l.viewCount,
        inquiryCount: l.inquiryCount,
        createdAt: l.createdAt,
      }));
  }

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

  const rows = await db
    .with(hero)
    .select({ listing: listings, heroUrl: hero.url })
    .from(listings)
    .leftJoin(hero, eq(hero.listingId, listings.id))
    .where(eq(listings.sellerId, userId))
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
    bodyType: l.bodyType ?? "—",
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

export interface Distribution {
  label: string;
  count: number;
  pct: number;
}
/** Counts over rolling windows (last 24h / 7 days / 30 days). */
export interface TimeRange {
  today: number;
  last7: number;
  last30: number;
}
export interface DealerAnalytics {
  totalViews: number;
  totalInquiries: number;
  totalLeads: number;
  activeListings: number;
  conversionRate: number; // leads / views, %
  byEmirate: Distribution[];
  byBodyType: Distribution[];
  byLeadType: Distribution[];
  topListings: { id: string; slug: string; title: string; views: number; inquiries: number }[];
  /** Rolling-window breakdowns the all-time counters can't provide. */
  timeRanges: { views: TimeRange; leads: TimeRange };
  /** Every stage of the sales pipeline, so the dealer sees status at a glance. */
  pipeline: PipelineStats;
}

export interface StageCount {
  key: string;
  label: string;
  count: number;
  /** Money represented by this stage, when meaningful. */
  valueAED?: number;
}

export interface PipelineStats {
  /** Listing lifecycle: active / pending review / reserved / sold / draft. */
  listings: StageCount[];
  /** Enquiry funnel by status. */
  enquiries: StageCount[];
  /** Quotation funnel: requested → responded → accepted / declined. */
  quotes: StageCount[];
  /** Order pipeline: pending → confirmed → in progress → completed. */
  orders: StageCount[];
  /** Headline money + conversion numbers across the whole funnel. */
  totals: {
    quoteRequests: number;
    quotedValueAED: number;
    acceptedValueAED: number;
    openOrders: number;
    openOrderValueAED: number;
    completedValueAED: number;
    /** Accepted quotes ÷ quotes the dealer actually priced, %. */
    quoteWinRate: number;
    /** Median hours from request to the dealer's response. */
    medianResponseHours: number | null;
  };
}

const LEAD_TYPE_LABEL: Record<string, string> = {
  inquiry: "Enquiries",
  test_drive: "Test drives",
  contact_unlock: "Contact unlocks",
  export_inquiry: "Export enquiries",
  finance_preapproval: "Finance requests",
};

function distribute<T>(
  rows: T[],
  key: (r: T) => string,
  weight: (r: T) => number = () => 1,
  top = 6,
): Distribution[] {
  const map = new Map<string, number>();
  let total = 0;
  for (const r of rows) {
    const k = key(r) || "—";
    const w = weight(r);
    map.set(k, (map.get(k) ?? 0) + w);
    total += w;
  }
  const list = Array.from(map, ([label, count]) => ({
    label,
    count,
    pct: total > 0 ? Math.round((count / total) * 100) : 0,
  })).sort((a, b) => b.count - a.count);
  return list.slice(0, top);
}

/** Count rows into a fixed, ordered set of stages (zeroes included). */
function stages<T>(
  rows: T[],
  status: (r: T) => string,
  order: { key: string; label: string }[],
  value?: (r: T) => number,
): StageCount[] {
  return order.map((s) => {
    const matching = rows.filter((r) => status(r) === s.key);
    return {
      key: s.key,
      label: s.label,
      count: matching.length,
      ...(value
        ? { valueAED: matching.reduce((sum, r) => sum + (value(r) || 0), 0) }
        : {}),
    };
  });
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
}

/**
 * Full pipeline snapshot for the signed-in dealer — listings, enquiries,
 * quotes and orders in one pass so the analytics page can show the status of
 * everything without each card doing its own query.
 */
async function getPipelineStats(
  inventory: Awaited<ReturnType<typeof getDealerInventory>>,
  leadRows: { status: string }[],
): Promise<PipelineStats> {
  const user = await getOrSyncUser().catch(() => null);
  const dealer = await getEffectiveDealer().catch(() => null);
  const [quotes, orders] = await Promise.all([
    getQuotesForDealer(dealer?.id, user?.id).catch(() => []),
    getOrdersForDealer(dealer?.id, user?.id).catch(() => []),
  ]);

  const quotedValue = quotes
    .filter((q) => q.quotedTotalAED)
    .reduce((s, q) => s + (q.quotedTotalAED ?? 0), 0);
  const acceptedValue = quotes
    .filter((q) => q.status === "accepted")
    .reduce((s, q) => s + (q.quotedTotalAED ?? 0), 0);
  const priced = quotes.filter((q) =>
    ["responded", "accepted", "declined"].includes(q.status),
  ).length;
  const won = quotes.filter((q) => q.status === "accepted").length;

  // Response speed: request → dealer's first pricing, in hours.
  const responseHours = quotes
    .filter((q) => q.respondedAt)
    .map(
      (q) =>
        Math.round(
          ((new Date(q.respondedAt!).getTime() -
            new Date(q.createdAt).getTime()) /
            3_600_000) *
            10,
        ) / 10,
    )
    .filter((h) => h >= 0);

  const openOrders = orders.filter((o) =>
    ["pending", "confirmed", "in_progress"].includes(o.status),
  );

  return {
    listings: stages(inventory, (l) => l.status, [
      { key: "active", label: "Active" },
      { key: "pending_review", label: "In review" },
      { key: "reserved", label: "Reserved" },
      { key: "sold", label: "Sold" },
      { key: "draft", label: "Draft" },
    ]),
    enquiries: stages(leadRows, (l) => l.status, [
      { key: "new", label: "New" },
      { key: "contacted", label: "In progress" },
      { key: "quoted", label: "Quoted" },
      { key: "closed", label: "Closed" },
    ]),
    quotes: stages(
      quotes,
      (q) => q.status,
      [
        { key: "requested", label: "New request" },
        { key: "under_review", label: "Under review" },
        { key: "responded", label: "Quote sent" },
        { key: "accepted", label: "Accepted" },
        { key: "declined", label: "Declined" },
        { key: "withdrawn", label: "Withdrawn" },
      ],
      (q) => q.quotedTotalAED ?? 0,
    ),
    orders: stages(
      orders,
      (o) => o.status,
      [
        { key: "pending", label: "Awaiting confirmation" },
        { key: "confirmed", label: "Confirmed" },
        { key: "in_progress", label: "In progress" },
        { key: "completed", label: "Completed" },
        { key: "cancelled", label: "Cancelled" },
      ],
      (o) => o.totalAED,
    ),
    totals: {
      quoteRequests: quotes.length,
      quotedValueAED: quotedValue,
      acceptedValueAED: acceptedValue,
      openOrders: openOrders.length,
      openOrderValueAED: openOrders.reduce((s, o) => s + o.totalAED, 0),
      completedValueAED: orders
        .filter((o) => o.status === "completed")
        .reduce((s, o) => s + o.totalAED, 0),
      quoteWinRate: priced > 0 ? Math.round((won / priced) * 100) : 0,
      medianResponseHours: median(responseHours),
    },
  };
}

/**
 * Analytics for whoever is signed in. Dealers get their whole inventory;
 * individuals who sell a car privately have no dealer record, so we fall back
 * to the listings they personally own — otherwise a private seller's analytics
 * would just be a page of zeroes.
 */
export async function getDealerAnalytics(): Promise<DealerAnalytics> {
  const dealerForScope = await getEffectiveDealer().catch(() => null);
  const viewer = await getOrSyncUser().catch(() => null);
  const inventory = dealerForScope
    ? await getDealerInventory()
    : viewer
      ? await getSellerListings(viewer.id).catch(() => [])
      : [];
  const totalViews = inventory.reduce((s, l) => s + l.viewCount, 0);
  const totalInquiries = inventory.reduce((s, l) => s + l.inquiryCount, 0);
  const activeListings = inventory.filter((l) => l.status === "active").length;

  // Lead type distribution + total, plus rolling-window (today/7d/30d) counts.
  let leadTypeCounts: { type: string; count: number }[] = [];
  let timeRanges: DealerAnalytics["timeRanges"] = {
    views: { today: 0, last7: 0, last30: 0 },
    leads: { today: 0, last7: 0, last30: 0 },
  };
  if (!isDbEnabled()) {
    const map = new Map<string, number>();
    for (const l of demoStore().leads)
      map.set(l.type, (map.get(l.type) ?? 0) + 1);
    leadTypeCounts = Array.from(map, ([type, count]) => ({ type, count }));
    const totalDemoLeads = demoStore().leads.length;
    // Demo has no event timeline; show plausible splits of the totals.
    timeRanges = {
      views: split(totalViews),
      leads: split(totalDemoLeads),
    };
  } else {
    const dealer = dealerForScope;
    leadTypeCounts = dealer
      ? ((await db
          .select({
            type: sql<string>`${leads.type}`,
            count: sql<number>`count(*)::int`,
          })
          .from(leads)
          .where(eq(leads.dealerId, dealer.id))
          .groupBy(leads.type)) as { type: string; count: number }[])
      : [];
    if (dealer) timeRanges = await computeTimeRanges(dealer.id);
  }
  const totalLeads = leadTypeCounts.reduce((s, r) => s + r.count, 0);

  const topListings = [...inventory]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 6)
    .map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      views: l.viewCount,
      inquiries: l.inquiryCount,
    }));

  // Enquiry statuses for the pipeline board (leads carry their own status),
  // scoped to the dealer OR to the private seller's own listings.
  const leadRows = await getLeadsForDealer(
    dealerForScope?.id,
    dealerForScope ? undefined : viewer?.id,
  ).catch(() => [] as { status: string }[]);
  const pipeline = await getPipelineStats(inventory, leadRows);

  return {
    totalViews,
    totalInquiries,
    totalLeads,
    activeListings,
    pipeline,
    conversionRate:
      totalViews > 0 ? Math.round((totalLeads / totalViews) * 1000) / 10 : 0,
    byEmirate: distribute(inventory, (l) => l.emirate, (l) => l.viewCount),
    byBodyType: distribute(inventory, (l) => l.bodyType, (l) => l.viewCount),
    byLeadType: distribute(
      leadTypeCounts,
      (r) => LEAD_TYPE_LABEL[r.type] ?? r.type,
      (r) => r.count,
    ),
    topListings,
    timeRanges,
  };
}

/** Demo-only: derive plausible today/7d/30d splits from an all-time total. */
function split(total: number): TimeRange {
  return {
    today: Math.round(total * 0.06),
    last7: Math.round(total * 0.3),
    last30: Math.round(total * 0.75),
  };
}

/**
 * Real rolling-window view + lead counts for a dealer, from the timestamped
 * listing_view_events table and leads.createdAt. Windows are rolling (last 24h
 * / 7 days / 30 days) so they're timezone-safe.
 */
async function computeTimeRanges(
  dealerId: string,
): Promise<DealerAnalytics["timeRanges"]> {
  const now = Date.now();
  const since = (days: number) => new Date(now - days * 86_400_000);
  const d1 = since(1);
  const d7 = since(7);
  const d30 = since(30);

  const [v] = await db
    .select({
      today: sql<number>`count(*) filter (where ${listingViewEvents.createdAt} >= ${d1})::int`,
      last7: sql<number>`count(*) filter (where ${listingViewEvents.createdAt} >= ${d7})::int`,
      last30: sql<number>`count(*) filter (where ${listingViewEvents.createdAt} >= ${d30})::int`,
    })
    .from(listingViewEvents)
    .innerJoin(listings, eq(listingViewEvents.listingId, listings.id))
    .where(eq(listings.dealerId, dealerId));

  const [l] = await db
    .select({
      today: sql<number>`count(*) filter (where ${leads.createdAt} >= ${d1})::int`,
      last7: sql<number>`count(*) filter (where ${leads.createdAt} >= ${d7})::int`,
      last30: sql<number>`count(*) filter (where ${leads.createdAt} >= ${d30})::int`,
    })
    .from(leads)
    .where(eq(leads.dealerId, dealerId));

  return {
    views: { today: v?.today ?? 0, last7: v?.last7 ?? 0, last30: v?.last30 ?? 0 },
    leads: { today: l?.today ?? 0, last7: l?.last7 ?? 0, last30: l?.last30 ?? 0 },
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
