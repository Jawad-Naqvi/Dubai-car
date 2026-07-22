import { NextResponse } from "next/server";
import { startCheckout } from "@/lib/data/payments";
import { getOrSyncUser } from "@/lib/data/users";

/**
 * POST /api/payments — start (or apply, for the free tier) a plan change.
 * For paid tiers this returns a Stripe Checkout `url` to redirect to; the
 * plan only actually activates once /api/webhooks/stripe confirms payment.
 */
export async function POST(req: Request) {
  const user = await getOrSyncUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.tier) {
    return NextResponse.json({ error: "tier required" }, { status: 400 });
  }
  try {
    const result = await startCheckout(String(body.tier));
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Payment failed" },
      { status: 422 },
    );
  }
}
