import { NextResponse } from "next/server";
import { listReviewsBySlug, createReviewBySlug } from "@/lib/data/reviews";
import { getOrSyncUser } from "@/lib/data/users";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** GET /api/dealers/[slug]/reviews → published reviews. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  return NextResponse.json({ reviews: await listReviewsBySlug(slug) });
}

/**
 * POST /api/dealers/[slug]/reviews  { rating, title?, body? } → create a review.
 * Requires a signed-in user; the author name comes from their account.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const user = await getOrSyncUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to review" }, { status: 401 });
  }
  const rl = rateLimit(`review:${user.id}`, 5, 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many reviews" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const res = await createReviewBySlug(slug, {
    rating: Number(body.rating),
    title: typeof body.title === "string" ? body.title : undefined,
    body: typeof body.body === "string" ? body.body : undefined,
    authorName: user.name,
    userId: user.id,
  });
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, reviews: await listReviewsBySlug(slug) });
}
