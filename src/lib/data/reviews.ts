import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { dealerReviews, dealers } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { bust } from "./revalidate";

export interface ReviewView {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
}

/** Resolve a dealer slug to its id (null if unknown). */
async function dealerIdForSlug(slug: string): Promise<string | null> {
  const rows = await db
    .select({ id: dealers.id })
    .from(dealers)
    .where(eq(dealers.slug, slug))
    .limit(1);
  return rows[0]?.id ?? null;
}

/** Published reviews for a dealer (by slug), newest first. */
export async function listReviewsBySlug(slug: string): Promise<ReviewView[]> {
  if (!isDbEnabled()) return [];
  const dealerId = await dealerIdForSlug(slug);
  if (!dealerId) return [];
  const rows = await db
    .select()
    .from(dealerReviews)
    .where(
      and(
        eq(dealerReviews.dealerId, dealerId),
        eq(dealerReviews.status, "published"),
      ),
    )
    .orderBy(desc(dealerReviews.createdAt))
    .limit(100);
  return rows.map((r) => ({
    id: r.id,
    authorName: r.authorName ?? "Verified buyer",
    rating: r.rating,
    title: r.title ?? "",
    body: r.body ?? "",
    createdAt: r.createdAt.toISOString(),
  }));
}

/**
 * Create a review and recompute the dealer's aggregate rating + review_count
 * from published rows — so `dealers.rating` becomes real data, not a constant.
 */
export async function createReviewBySlug(
  slug: string,
  input: {
    rating: number;
    title?: string;
    body?: string;
    authorName?: string;
    userId?: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  if (!isDbEnabled()) return { ok: false, error: "Database not configured" };
  const rating = Math.round(input.rating);
  if (!(rating >= 1 && rating <= 5)) return { ok: false, error: "Rating must be 1–5" };

  const dealerId = await dealerIdForSlug(slug);
  if (!dealerId) return { ok: false, error: "Dealer not found" };

  await db.insert(dealerReviews).values({
    dealerId,
    userId: input.userId,
    authorName: input.authorName?.slice(0, 120) || "Verified buyer",
    rating,
    title: input.title?.slice(0, 160),
    body: input.body?.slice(0, 4000),
    status: "published",
  });

  // Recompute aggregate from published reviews.
  const [agg] = await db
    .select({
      avg: sql<number>`coalesce(avg(${dealerReviews.rating}), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(dealerReviews)
    .where(
      and(
        eq(dealerReviews.dealerId, dealerId),
        eq(dealerReviews.status, "published"),
      ),
    );

  await db
    .update(dealers)
    .set({
      rating: Math.round((agg?.avg ?? 0) * 10) / 10,
      reviewCount: agg?.count ?? 0,
    })
    .where(eq(dealers.id, dealerId));

  bust("dealers");
  bust("listings");
  return { ok: true };
}
