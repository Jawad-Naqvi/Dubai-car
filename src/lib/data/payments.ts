import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, dealers, subscriptions } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { demoStore, demoId } from "./demo-store";
import { getCurrentDealer } from "./users";
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
 * Payment gateway adapter. With PayTabs/Stripe keys this would create a hosted
 * checkout and return a redirect URL; in demo mode we simulate an instant
 * successful charge so the subscription / lead-unlock flows are fully testable.
 */
export function isGatewayEnabled(): boolean {
  return Boolean(
    process.env.PAYTABS_PROFILE_ID || process.env.STRIPE_SECRET_KEY,
  );
}

export async function changePlan(
  tierId: string,
): Promise<{ ok: boolean; tier: string; amountAED: number }> {
  const tier = subscriptionTiers.find((t) => t.id === tierId);
  if (!tier) throw new Error("Unknown plan");

  if (!isDbEnabled()) {
    const store = demoStore();
    store.currentTier = tier.id;
    if (tier.monthlyAED > 0) {
      store.payments.unshift({
        id: demoId("INV"),
        amountAED: tier.monthlyAED,
        type: "subscription",
        gateway: isGatewayEnabled() ? "paytabs" : "paytabs",
        status: "paid",
        description: `${tier.name} subscription`,
        createdAt: new Date().toISOString(),
      });
    }
    return { ok: true, tier: tier.id, amountAED: tier.monthlyAED };
  }

  const dealer = await getCurrentDealer();
  if (dealer) {
    await db
      .update(dealers)
      .set({ subscriptionTier: tier.id as typeof dealer.subscriptionTier })
      .where(eq(dealers.id, dealer.id));
    await db.insert(subscriptions).values({
      dealerId: dealer.id,
      tier: tier.id as typeof dealer.subscriptionTier,
      status: "active",
    });
    if (tier.monthlyAED > 0) {
      await db.insert(payments).values({
        amountAED: tier.monthlyAED,
        type: "subscription",
        gateway: "paytabs",
        status: "paid",
        metadata: { tier: tier.id },
      });
    }
  }
  return { ok: true, tier: tier.id, amountAED: tier.monthlyAED };
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
