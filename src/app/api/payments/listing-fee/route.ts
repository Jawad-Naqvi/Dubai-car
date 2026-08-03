import { NextResponse } from "next/server";
import { startListingFeeCheckout } from "@/lib/data/payments";
import { getOrSyncUser } from "@/lib/data/users";

/**
 * POST /api/payments/listing-fee — start Stripe Checkout for an individual's
 * per-listing fee. Returns a `url` to redirect to; the listing goes live for
 * review only after the webhook confirms payment.
 */
export async function POST(req: Request) {
  const user = await getOrSyncUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }
  try {
    const result = await startListingFeeCheckout(String(body.listingId));
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Payment failed" },
      { status: 422 },
    );
  }
}
