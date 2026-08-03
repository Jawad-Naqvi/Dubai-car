import "server-only";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { listings, dealers, users, listingMedia, leads, payments, b2bBuyers } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { mockDealers, mockListings } from "@/lib/mock-data";
import { demoStore } from "./demo-store";
import { bust } from "./revalidate";
import { subscriptionTiers } from "@/lib/brand";
import { sendEmail } from "@/lib/notify";

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
  /** All uploaded photos, so admins can review the full set inline. */
  images: string[];
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
        images: l.imageUrls?.length ? l.imageUrls : [l.imageUrl],
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

  // Fetch every photo for the pending listings so admins can review the full
  // set inline (not just one hero thumbnail).
  const ids = rows.map((r) => r.listing.id);
  const mediaByListing = new Map<string, string[]>();
  if (ids.length) {
    const media = await db
      .select({ listingId: listingMedia.listingId, url: listingMedia.url })
      .from(listingMedia)
      .where(inArray(listingMedia.listingId, ids))
      .orderBy(listingMedia.sortOrder);
    for (const m of media) {
      const arr = mediaByListing.get(m.listingId) ?? [];
      arr.push(m.url);
      mediaByListing.set(m.listingId, arr);
    }
  }

  const FALLBACK =
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80";
  return rows.map(({ listing: l, dealerName, heroUrl }) => {
    const images = mediaByListing.get(l.id) ?? [];
    return {
      id: l.id,
      slug: l.slug,
      title: `${l.year} ${l.make} ${l.model}`,
      dealerName: dealerName ?? "Private seller",
      priceAED: l.priceAED,
      kms: l.kms,
      emirate: l.emirate,
      regionalSpec: l.regionalSpec ?? "—",
      imageUrl: heroUrl || images[0] || FALLBACK,
      images: images.length ? images : [heroUrl || FALLBACK],
      createdAt: l.createdAt.toISOString(),
    };
  });
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
  const [row] = await db
    .update(users)
    .set({ role: role as "buyer" | "dealer" | "b2b_importer" | "admin" })
    .where(eq(users.id, id))
    .returning({ clerkId: users.clerkId });
  // Keep Clerk publicMetadata (the RBAC source of truth) in sync, like
  // approveDealer does — otherwise a DB-only role change wouldn't take effect.
  if (row?.clerkId) {
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(row.clerkId, {
        publicMetadata: { role },
      });
    } catch {
      // DB role updated; Clerk reconciles on next sync.
    }
  }
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
  kycStatus: "pending" | "approved" | "rejected";
  kycSubmittedAt?: string;
  kycRejectionReason?: string;
  emiratesIdNumber?: string;
  tradeLicense?: string;
  hasEmiratesIdFront: boolean;
  hasEmiratesIdBack: boolean;
  hasTradeLicenseDoc: boolean;
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
      kycStatus: d.isVerified ? "approved" : "pending",
      hasEmiratesIdFront: false,
      hasEmiratesIdBack: false,
      hasTradeLicenseDoc: false,
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
    kycStatus: r.dealer.kycStatus,
    kycSubmittedAt: r.dealer.kycSubmittedAt?.toISOString(),
    kycRejectionReason: r.dealer.kycRejectionReason ?? undefined,
    emiratesIdNumber: r.dealer.emiratesIdNumber ?? undefined,
    tradeLicense: r.dealer.tradeLicense ?? undefined,
    hasEmiratesIdFront: !!r.dealer.emiratesIdFrontUrl,
    hasEmiratesIdBack: !!r.dealer.emiratesIdBackUrl,
    hasTradeLicenseDoc: !!r.dealer.tradeLicenseDocUrl,
  }));
}

/**
 * Approve a pending seller application: mark KYC approved + verified, and —
 * the only place this happens — promote the applicant's role to "dealer" in
 * both the DB and Clerk publicMetadata (RBAC source of truth).
 */
export async function approveDealer(id: string): Promise<boolean> {
  if (!isDbEnabled()) {
    bust("dealers");
    return true;
  }
  const [dealer] = await db.select().from(dealers).where(eq(dealers.id, id)).limit(1);
  if (!dealer) return false;

  await db
    .update(dealers)
    .set({
      kycStatus: "approved",
      isVerified: true,
      verifiedAt: new Date(),
      kycReviewedAt: new Date(),
      kycRejectionReason: null,
    })
    .where(eq(dealers.id, id));

  const [owner] = await db.select().from(users).where(eq(users.id, dealer.userId)).limit(1);
  if (owner) {
    await db.update(users).set({ role: "dealer" }).where(eq(users.id, owner.id));
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(owner.clerkId, {
        publicMetadata: { role: "dealer" },
      });
    } catch {
      // DB role still updated; Clerk metadata will reconcile on next webhook.
    }
    await sendEmail({
      to: owner.email,
      subject: "You're approved to sell on DXB Motors",
      body: `Good news — "${dealer.businessName}" has been verified and approved. Sign in and open your dashboard to start listing inventory.`,
      label: "kyc approved",
    });
  }

  bust("dealers");
  return true;
}

export async function rejectDealer(id: string, reason: string): Promise<boolean> {
  if (!isDbEnabled()) {
    bust("dealers");
    return true;
  }
  const [dealer] = await db.select().from(dealers).where(eq(dealers.id, id)).limit(1);
  if (!dealer) return false;

  await db
    .update(dealers)
    .set({ kycStatus: "rejected", kycRejectionReason: reason, kycReviewedAt: new Date() })
    .where(eq(dealers.id, id));

  const [owner] = await db.select().from(users).where(eq(users.id, dealer.userId)).limit(1);
  if (owner) {
    await sendEmail({
      to: owner.email,
      subject: "Your DXB Motors seller application needs changes",
      body: `We couldn't approve "${dealer.businessName}" yet: ${reason}\n\nUpdate your application at /sell/become-seller and resubmit.`,
      label: "kyc rejected",
    });
  }

  bust("dealers");
  return true;
}

/* ---------------- Activity / Audit ---------------- */

export interface ActivityItem {
  type: string;
  label: string;
  detail: string;
  at: string;
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  if (!isDbEnabled()) {
    const s = demoStore();
    const items: ActivityItem[] = [
      ...s.leads.map((l) => ({
        type: "lead",
        label: "New lead",
        detail: `${l.buyerName ?? "Someone"} · ${l.type}`,
        at: l.createdAt,
      })),
      ...s.newListings.map((l) => ({
        type: "listing",
        label: "Listing created",
        detail: `${l.year} ${l.make} ${l.model}`,
        at: l.createdAt,
      })),
      ...s.b2bBuyers.map((b) => ({
        type: "b2b",
        label: "B2B registration",
        detail: `${b.companyName} (${b.country})`,
        at: b.createdAt,
      })),
    ];
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 50);
  }

  const [recentListings, recentLeads, recentPayments, recentB2B] = await Promise.all([
    db
      .select({ make: listings.make, model: listings.model, year: listings.year, status: listings.status, at: listings.createdAt })
      .from(listings)
      .orderBy(desc(listings.createdAt))
      .limit(20),
    db
      .select({ name: leads.buyerName, type: leads.type, at: leads.createdAt })
      .from(leads)
      .orderBy(desc(leads.createdAt))
      .limit(20),
    db
      .select({ amount: payments.amountAED, type: payments.type, at: payments.createdAt })
      .from(payments)
      .orderBy(desc(payments.createdAt))
      .limit(20),
    db
      .select({ company: b2bBuyers.companyName, country: b2bBuyers.country, at: b2bBuyers.createdAt })
      .from(b2bBuyers)
      .orderBy(desc(b2bBuyers.createdAt))
      .limit(20),
  ]);

  const items: ActivityItem[] = [
    ...recentListings.map((l) => ({
      type: "listing",
      label: l.status === "active" ? "Listing published" : "Listing created",
      detail: `${l.year} ${l.make} ${l.model}`,
      at: l.at.toISOString(),
    })),
    ...recentLeads.map((l) => ({
      type: "lead",
      label: "New lead",
      detail: `${l.name ?? "Someone"} · ${l.type}`,
      at: l.at.toISOString(),
    })),
    ...recentPayments.map((p) => ({
      type: "payment",
      label: "Payment",
      detail: `AED ${p.amount} · ${p.type}`,
      at: p.at.toISOString(),
    })),
    ...recentB2B.map((b) => ({
      type: "b2b",
      label: "B2B registration",
      detail: `${b.company} (${b.country})`,
      at: b.at.toISOString(),
    })),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 50);
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
