import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings, dealers, users, listingMedia, leads, payments } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { mockDealers, mockListings } from "@/lib/mock-data";
import { demoStore } from "./demo-store";
import { bust } from "./revalidate";
import { subscriptionTiers } from "@/lib/brand";

export interface ModerationItem {
  id: string;
  slug: string;
  title: string;
  dealerName: string;
  priceAED: number;
  kms: number;
  emirate: string;
  regionalSpec: string;
  imageUrl: string;
  createdAt?: string;
}

export async function getModerationQueue(): Promise<ModerationItem[]> {
  if (!isDbEnabled()) {
    return demoStore()
      .newListings.filter((l) => l.moderationStatus === "pending_review")
      .map((l) => ({
        id: l.id,
        slug: l.slug,
        title: `${l.year} ${l.make} ${l.model}`,
        dealerName: l.dealer.name,
        priceAED: l.priceAED,
        kms: l.kms,
        emirate: l.emirate,
        regionalSpec: l.regionalSpec,
        imageUrl: l.imageUrl,
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
      .groupBy(listingMedia.listingId),
  );
  const rows = await db
    .with(hero)
    .select({ listing: listings, dealerName: dealers.businessName, heroUrl: hero.url })
    .from(listings)
    .leftJoin(dealers, eq(listings.dealerId, dealers.id))
    .leftJoin(hero, eq(hero.listingId, listings.id))
    .where(eq(listings.status, "pending_review"))
    .orderBy(desc(listings.createdAt))
    .limit(100);
  return rows.map(({ listing: l, dealerName, heroUrl }) => ({
    id: l.id,
    slug: l.slug,
    title: `${l.year} ${l.make} ${l.model}`,
    dealerName: dealerName ?? "Private seller",
    priceAED: l.priceAED,
    kms: l.kms,
    emirate: l.emirate,
    regionalSpec: l.regionalSpec ?? "—",
    imageUrl:
      heroUrl ||
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80",
    createdAt: l.createdAt.toISOString(),
  }));
}

export async function moderateListing(
  id: string,
  action: "approve" | "reject",
): Promise<boolean> {
  if (!isDbEnabled()) {
    const l = demoStore().newListings.find((x) => x.id === id);
    if (l) l.moderationStatus = action === "approve" ? "active" : "rejected";
    bust("listings");
    return true;
  }
  await db
    .update(listings)
    .set({
      status: action === "approve" ? "active" : "rejected",
      ...(action === "approve" ? { publishedAt: new Date() } : {}),
    })
    .where(eq(listings.id, id));
  bust("listings");
  return true;
}

/* ---------------- Users ---------------- */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  if (!isDbEnabled()) {
    const dealerUsers: AdminUser[] = mockDealers.map((d, i) => ({
      id: `U-${d.id}`,
      name: d.name,
      email: `owner${i + 1}@${d.slug}.ae`,
      role: "dealer",
    }));
    const b2b: AdminUser[] = demoStore().b2bBuyers.map((b) => ({
      id: b.id,
      name: b.companyName,
      email: b.email ?? "—",
      role: "b2b_importer",
      createdAt: b.createdAt,
    }));
    const buyers: AdminUser[] = [
      { id: "U-B1", name: "Ahmed Saleh", email: "ahmed@gmail.com", role: "buyer" },
      { id: "U-B2", name: "Priya Sharma", email: "priya@gmail.com", role: "buyer" },
      { id: "U-ADMIN", name: "Platform Admin", email: "admin@dxbmotors.ae", role: "admin" },
    ];
    return [...buyers, ...dealerUsers, ...b2b];
  }
  const rows = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(500);
  return rows.map((u) => ({
    id: u.id,
    name: u.name ?? "—",
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function setUserRole(id: string, role: string): Promise<boolean> {
  if (!isDbEnabled()) return true; // demo: accept (no Clerk write here)
  await db
    .update(users)
    .set({ role: role as "buyer" | "dealer" | "b2b_importer" | "admin" })
    .where(eq(users.id, id));
  return true;
}

/* ---------------- Dealers ---------------- */

export interface AdminDealer {
  id: string;
  slug: string;
  name: string;
  emirate: string;
  tier: string;
  isVerified: boolean;
  listingCount: number;
  rating: number;
}

export async function getAdminDealers(): Promise<AdminDealer[]> {
  if (!isDbEnabled()) {
    return mockDealers.map((d, i) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      emirate: d.emirate,
      tier: i % 3 === 0 ? "platinum" : i % 3 === 1 ? "gold" : "silver",
      isVerified: d.isVerified,
      listingCount: mockListings.filter((l) => l.dealer.slug === d.slug).length,
      rating: d.rating,
    }));
  }
  const rows = await db
    .select({
      dealer: dealers,
      listingCount: sql<number>`count(${listings.id})::int`,
    })
    .from(dealers)
    .leftJoin(listings, eq(listings.dealerId, dealers.id))
    .groupBy(dealers.id)
    .orderBy(desc(dealers.isFeatured));
  return rows.map((r) => ({
    id: r.dealer.id,
    slug: r.dealer.slug,
    name: r.dealer.businessName,
    emirate: r.dealer.emirate,
    tier: r.dealer.subscriptionTier,
    isVerified: r.dealer.isVerified,
    listingCount: r.listingCount,
    rating: r.dealer.rating ?? 0,
  }));
}

export async function toggleDealerVerified(
  id: string,
  verified: boolean,
): Promise<boolean> {
  if (!isDbEnabled()) {
    bust("dealers");
    return true;
  }
  await db
    .update(dealers)
    .set({ isVerified: verified, verifiedAt: verified ? new Date() : null })
    .where(eq(dealers.id, id));
  bust("dealers");
  return true;
}

/* ---------------- Revenue ---------------- */

export interface RevenueData {
  totalMRR: number;
  streams: { label: string; amount: number }[];
  subscriptionSplit: { tier: string; count: number; mrr: number }[];
}

export async function getRevenueData(): Promise<RevenueData> {
  if (!isDbEnabled()) {
    const dealersList = mockDealers;
    const split = subscriptionTiers
      .filter((t) => t.monthlyAED > 0)
      .map((t, idx) => {
        const count = dealersList.filter(
          (_, i) => (i % 3 === 0 ? "platinum" : i % 3 === 1 ? "gold" : "silver") === t.id,
        ).length;
        return { tier: t.name, count, mrr: count * t.monthlyAED, _idx: idx };
      })
      .map(({ _idx, ...rest }) => rest);
    const subMRR = split.reduce((s, x) => s + x.mrr, 0);
    const leadFees = demoStore().leads.reduce((s, l) => s + l.feeAED, 0);
    const featured = 49 * 6;
    return {
      totalMRR: subMRR + leadFees + featured,
      streams: [
        { label: "Dealer subscriptions", amount: subMRR },
        { label: "Lead / contact fees", amount: leadFees },
        { label: "Featured listings", amount: featured },
        { label: "B2B export connections", amount: demoStore().leads.filter((l) => l.type === "export_inquiry").length * 250 },
      ],
      subscriptionSplit: split,
    };
  }

  const dealerRows = await db
    .select({ tier: dealers.subscriptionTier, c: sql<number>`count(*)::int` })
    .from(dealers)
    .groupBy(dealers.subscriptionTier);
  const split = subscriptionTiers
    .filter((t) => t.monthlyAED > 0)
    .map((t) => {
      const count = dealerRows.find((d) => d.tier === t.id)?.c ?? 0;
      return { tier: t.name, count, mrr: count * t.monthlyAED };
    });
  const subMRR = split.reduce((s, x) => s + x.mrr, 0);
  const leadRows = await db
    .select({ s: sql<number>`coalesce(sum(${leads.feeAED}),0)::int` })
    .from(leads);
  const payRows = await db
    .select({ s: sql<number>`coalesce(sum(${payments.amountAED}),0)::int` })
    .from(payments);
  const leadFees = leadRows[0]?.s ?? 0;
  return {
    totalMRR: subMRR + leadFees,
    streams: [
      { label: "Dealer subscriptions", amount: subMRR },
      { label: "Lead / contact fees", amount: leadFees },
      { label: "Payments collected", amount: payRows[0]?.s ?? 0 },
    ],
    subscriptionSplit: split,
  };
}
