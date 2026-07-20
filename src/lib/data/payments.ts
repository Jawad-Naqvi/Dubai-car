import "server-only";
import Stripe from "stripe";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, dealers, subscriptions } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { demoStore } from "./demo-store";
import { getEffectiveDealer, getOrSyncUser } from "./users";
import { bust } from "./revalidate";
import { subscriptionTiers } from "@/lib/brand";

export interface InvoiceView {
  id: string;
  amountAED: number;
  type: string;
  status: string;
  description: string;
  createdAt: string;
}

/**
 * Real payment gateway — Stripe Checkout. Until STRIPE_SECRET_KEY is set,
 * upgrades are blocked with a clear "not configured" error rather than a
 * fake-success demo path (the old behavior this replaces).
 */
export function isGatewayEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured.");
  return new Stripe(key);
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

const TIER_PRICE_ENV: Record<string, string> = {
  silver: "STRIPE_PRICE_SILVER",
  gold: "STRIPE_PRICE_GOLD",
  platinum: "STRIPE_PRICE_PLATINUM",
};

/**
 * Start (or resume) a plan change. Free tier applies immediately — no charge,
 * no gateway needed. Paid tiers create a real Stripe Checkout session and
 * return its redirect URL; the subscription only actually activates once the
 * webhook confirms payment (see /api/webhooks/stripe).
 */
export async function startCheckout(
  tierId: string,
): Promise<{ url?: string; ok: boolean; tier: string }> {
  const tier = subscriptionTiers.find((t) => t.id === tierId);
  if (!tier) throw new Error("Unknown plan");

  if (!isDbEnabled()) {
    const store = demoStore();
    store.currentTier = tier.id;
    return { ok: true, tier: tier.id };
  }

  const dealer = await getEffectiveDealer();
  if (!dealer) throw new Error("No dealer account found.");

  if (tier.monthlyAED === 0) {
    await db
      .update(dealers)
      .set({ subscriptionTier: "free", pendingTier: null })
      .where(eq(dealers.id, dealer.id));
    await db.insert(subscriptions).values({
      dealerId: dealer.id,
      tier: "free",
      status: "active",
    });
    bust("dealers");
    return { ok: true, tier: tier.id };
  }

  if (!isGatewayEnabled()) {
    throw new Error(
      "Payments aren't configured yet — add a live STRIPE_SECRET_KEY to enable plan upgrades.",
    );
  }
  const priceEnvVar = TIER_PRICE_ENV[tierId];
  const priceId = priceEnvVar ? process.env[priceEnvVar] : undefined;
  if (!priceId) {
    throw new Error(
      `Stripe price for "${tier.name}" isn't set up yet (missing ${priceEnvVar}).`,
    );
  }

  const stripe = stripeClient();
  const user = await getOrSyncUser();

  let customerId = dealer.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email,
      name: dealer.businessName,
      metadata: { dealerId: dealer.id },
    });
    customerId = customer.id;
    await db
      .update(dealers)
      .set({ stripeCustomerId: customerId })
      .where(eq(dealers.id, dealer.id));
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl()}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl()}/dashboard/billing?checkout=cancelled`,
    metadata: { dealerId: dealer.id, tier: tierId },
    subscription_data: { metadata: { dealerId: dealer.id, tier: tierId } },
  });

  await db
    .update(dealers)
    .set({ pendingTier: tierId as typeof dealer.subscriptionTier })
    .where(eq(dealers.id, dealer.id));

  if (!session.url) throw new Error("Could not start checkout session.");
  return { ok: true, tier: tierId, url: session.url };
}

/** Stripe customer billing portal — real card/payment-method management. */
export async function startBillingPortal(): Promise<{ url: string }> {
  if (!isGatewayEnabled()) {
    throw new Error("Payments aren't configured yet.");
  }
  const dealer = await getEffectiveDealer();
  if (!dealer?.stripeCustomerId) {
    throw new Error("No billing account yet — upgrade a plan first to create one.");
  }
  const stripe = stripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: dealer.stripeCustomerId,
    return_url: `${appUrl()}/dashboard/billing`,
  });
  return { url: session.url };
}

export async function getInvoices(): Promise<InvoiceView[]> {
  if (!isDbEnabled()) {
    return demoStore().payments.map((p) => ({
      id: p.id,
      amountAED: p.amountAED,
      type: p.type,
      status: p.status,
      description: p.description,
      createdAt: p.createdAt,
    }));
  }
  const rows = await db
    .select()
    .from(payments)
    .orderBy(desc(payments.createdAt))
    .limit(100);
  return rows.map((p) => ({
    id: p.id.slice(0, 8).toUpperCase(),
    amountAED: p.amountAED,
    type: p.type,
    status: p.status,
    description:
      (p.metadata as { tier?: string } | null)?.tier
        ? `${(p.metadata as { tier?: string }).tier} subscription`
        : p.type,
    createdAt: p.createdAt.toISOString(),
  }));
}
