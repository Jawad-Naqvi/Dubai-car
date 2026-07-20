import { NextResponse } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dealers, payments, subscriptions } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { bust } from "@/lib/data/revalidate";
import { subscriptionTiers } from "@/lib/brand";

export const runtime = "nodejs";

/**
 * Stripe webhook — the ONLY place a plan upgrade actually takes effect.
 * startCheckout() (src/lib/data/payments.ts) just opens a Checkout session;
 * this route verifies Stripe's signature and, on confirmed payment, flips
 * dealers.subscriptionTier and records a real payments row. Idempotent via
 * payments.stripeEventId (unique).
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!secret || !stripeKey || !isDbEnabled()) {
    return new NextResponse("Not configured", { status: 404 });
  }

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  if (!sig) return new NextResponse("Missing signature", { status: 400 });

  const stripe = new Stripe(stripeKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    return new NextResponse(
      `Webhook signature verification failed: ${e instanceof Error ? e.message : "invalid"}`,
      { status: 400 },
    );
  }

  const existing = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.stripeEventId, event.id))
    .limit(1);
  if (existing[0]) return NextResponse.json({ ok: true, duplicate: true });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const dealerId = session.metadata?.dealerId;
    const tierId = session.metadata?.tier;
    if (dealerId && tierId) {
      const tier = subscriptionTiers.find((t) => t.id === tierId);
      await db
        .update(dealers)
        .set({
          subscriptionTier: tierId as "silver" | "gold" | "platinum",
          pendingTier: null,
          stripeSubscriptionId:
            typeof session.subscription === "string" ? session.subscription : undefined,
        })
        .where(eq(dealers.id, dealerId));
      await db.insert(subscriptions).values({
        dealerId,
        tier: tierId as "silver" | "gold" | "platinum",
        status: "active",
        stripeSubscriptionId:
          typeof session.subscription === "string" ? session.subscription : undefined,
      });
      await db.insert(payments).values({
        amountAED: tier?.monthlyAED ?? 0,
        type: "subscription",
        gateway: "stripe",
        gatewayRef: session.id,
        stripeEventId: event.id,
        status: "paid",
        metadata: { tier: tierId },
      });
      bust("dealers");
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const dealerId = sub.metadata?.dealerId;
    if (dealerId) {
      await db
        .update(dealers)
        .set({ subscriptionTier: "free", stripeSubscriptionId: null })
        .where(eq(dealers.id, dealerId));
      bust("dealers");
    }
  }

  return NextResponse.json({ ok: true });
}
