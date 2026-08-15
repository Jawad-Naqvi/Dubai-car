import "server-only";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, quotes, orders } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { demoStore } from "./demo-store";

/**
 * Everything a buyer has done to a seller's listing, per listing.
 *
 * A seller shouldn't have to open three different screens to find out that a
 * car got two messages, a bulk quote request and an order — this rolls all of
 * it up so the listing card itself can say what needs attention.
 */
export interface ListingActivity {
  enquiries: number;
  /** Enquiries still sitting in "new" — nobody has replied yet. */
  newEnquiries: number;
  quotes: number;
  /** Quote requests waiting on the seller to price them. */
  openQuotes: number;
  orders: number;
  /** Orders not yet completed or cancelled. */
  openOrders: number;
  /** Anything at all that needs the seller to act. */
  needsAction: number;
  /** Most recent event, for the "2h ago" line on the card. */
  lastAt?: string;
}

const EMPTY: ListingActivity = {
  enquiries: 0,
  newEnquiries: 0,
  quotes: 0,
  openQuotes: 0,
  orders: 0,
  openOrders: 0,
  needsAction: 0,
  lastAt: undefined,
};

function blank(): ListingActivity {
  return { ...EMPTY };
}

function newer(a: string | undefined, b: string): string {
  if (!a) return b;
  return new Date(b) > new Date(a) ? b : a;
}

/**
 * Roll up leads, quote requests and orders for a set of listings in three
 * queries (not three per listing), keyed by listing id.
 */
export async function getListingActivity(
  listingIds: string[],
): Promise<Record<string, ListingActivity>> {
  const out: Record<string, ListingActivity> = {};
  if (listingIds.length === 0) return out;
  for (const id of listingIds) out[id] = blank();

  /* ---------- demo mode ---------- */
  if (!isDbEnabled()) {
    const store = demoStore();
    for (const l of store.leads) {
      if (!l.listingId || !out[l.listingId]) continue;
      const a = out[l.listingId];
      a.enquiries += 1;
      if (l.status === "new") a.newEnquiries += 1;
      a.lastAt = newer(a.lastAt, l.createdAt);
    }
    for (const q of store.quotes) {
      if (!q.listingId || !out[q.listingId]) continue;
      const a = out[q.listingId];
      a.quotes += 1;
      if (["requested", "under_review"].includes(q.status)) a.openQuotes += 1;
      a.lastAt = newer(a.lastAt, q.createdAt);
    }
    for (const o of store.orders) {
      if (!o.listingId || !out[o.listingId]) continue;
      const a = out[o.listingId];
      a.orders += 1;
      if (["pending", "confirmed", "in_progress"].includes(o.status))
        a.openOrders += 1;
      a.lastAt = newer(a.lastAt, o.createdAt);
    }
    for (const id of listingIds) {
      const a = out[id];
      a.needsAction = a.newEnquiries + a.openQuotes + a.openOrders;
    }
    return out;
  }

  /* ---------- DB mode ---------- */
  try {
    const [leadRows, quoteRows, orderRows] = await Promise.all([
      db
        .select({
          listingId: leads.listingId,
          status: leads.status,
          createdAt: leads.createdAt,
        })
        .from(leads)
        .where(inArray(leads.listingId, listingIds))
        .orderBy(desc(leads.createdAt))
        .limit(1000),
      db
        .select({
          listingId: quotes.listingId,
          status: quotes.status,
          createdAt: quotes.createdAt,
        })
        .from(quotes)
        .where(inArray(quotes.listingId, listingIds))
        .orderBy(desc(quotes.createdAt))
        .limit(1000),
      db
        .select({
          listingId: orders.listingId,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(inArray(orders.listingId, listingIds))
        .orderBy(desc(orders.createdAt))
        .limit(1000),
    ]);

    for (const r of leadRows) {
      const a = r.listingId ? out[r.listingId] : undefined;
      if (!a) continue;
      a.enquiries += 1;
      if (r.status === "new") a.newEnquiries += 1;
      a.lastAt = newer(a.lastAt, r.createdAt.toISOString());
    }
    for (const r of quoteRows) {
      const a = r.listingId ? out[r.listingId] : undefined;
      if (!a) continue;
      a.quotes += 1;
      if (["requested", "under_review"].includes(r.status)) a.openQuotes += 1;
      a.lastAt = newer(a.lastAt, r.createdAt.toISOString());
    }
    for (const r of orderRows) {
      const a = r.listingId ? out[r.listingId] : undefined;
      if (!a) continue;
      a.orders += 1;
      if (["pending", "confirmed", "in_progress"].includes(r.status))
        a.openOrders += 1;
      a.lastAt = newer(a.lastAt, r.createdAt.toISOString());
    }

    for (const id of listingIds) {
      const a = out[id];
      a.needsAction = a.newEnquiries + a.openQuotes + a.openOrders;
    }
  } catch {
    /* activity is a nice-to-have — never break the listings page over it */
  }

  return out;
}
