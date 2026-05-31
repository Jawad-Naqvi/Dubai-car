import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, listings, type Lead } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { demoStore, demoId, type DemoLead } from "./demo-store";
import { sendLeadNotification } from "@/lib/notify";

export interface CreateLeadInput {
  listingId?: string;
  buyerId?: string;
  dealerId?: string;
  type: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  message?: string;
  destinationCountry?: string;
  quantity?: number;
  shippingPreference?: string;
}

/** Lead fee schedule from the proposal (§8.3 / §8.5). */
export function leadFeeFor(type: string, listingPriceAED?: number): number {
  if (type === "export_inquiry") return 250; // AED 150–500 per B2B lead
  if (type === "contact_unlock") {
    if (!listingPriceAED) return 25;
    if (listingPriceAED > 400000) return 75;
    if (listingPriceAED > 150000) return 50;
    return 25;
  }
  return 0;
}

export async function createLead(input: CreateLeadInput): Promise<{ id: string }> {
  const type = input.type || "inquiry";

  if (!isDbEnabled()) {
    const store = demoStore();
    const lead: DemoLead = {
      id: demoId("LD"),
      listingId: input.listingId,
      type,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      buyerPhone: input.buyerPhone,
      message: input.message,
      destinationCountry: input.destinationCountry,
      quantity: input.quantity,
      shippingPreference: input.shippingPreference,
      feeAED: leadFeeFor(type),
      status: "new",
      createdAt: new Date().toISOString(),
    };
    store.leads.unshift(lead);
    void sendLeadNotification({
      subject: `New ${type} lead from ${input.buyerName ?? "a buyer"}`,
      body: `${input.message ?? ""}\nContact: ${input.buyerPhone ?? input.buyerEmail ?? "—"}`,
    });
    return { id: lead.id };
  }

  // Look up the listing's dealer + price for routing and fee calc.
  let dealerId = input.dealerId;
  let price: number | undefined;
  if (input.listingId) {
    const l = await db
      .select({ dealerId: listings.dealerId, price: listings.priceAED })
      .from(listings)
      .where(eq(listings.id, input.listingId))
      .limit(1);
    if (l[0]) {
      dealerId = dealerId ?? l[0].dealerId ?? undefined;
      price = l[0].price;
    }
    await db
      .update(listings)
      .set({ inquiryCount: sql`${listings.inquiryCount} + 1` })
      .where(eq(listings.id, input.listingId));
  }

  const [row] = await db
    .insert(leads)
    .values({
      listingId: input.listingId,
      buyerId: input.buyerId,
      dealerId,
      type: type as Lead["type"],
      feeAED: leadFeeFor(type, price),
      message: input.message,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      buyerPhone: input.buyerPhone,
      destinationCountry: input.destinationCountry,
      quantity: input.quantity,
      shippingPreference: input.shippingPreference,
      status: "new",
    })
    .returning({ id: leads.id });

  void sendLeadNotification({
    subject: `New ${type} lead from ${input.buyerName ?? "a buyer"}`,
    body: `${input.message ?? ""}\nContact: ${input.buyerPhone ?? input.buyerEmail ?? "—"}`,
  });

  return { id: row.id };
}

export async function updateLeadStatus(
  id: string,
  status: string,
): Promise<boolean> {
  if (!isDbEnabled()) {
    const lead = demoStore().leads.find((l) => l.id === id);
    if (lead) lead.status = status;
    return true;
  }
  await db.update(leads).set({ status }).where(eq(leads.id, id));
  return true;
}

export interface LeadView {
  id: string;
  type: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  message: string;
  destinationCountry?: string;
  feeAED: number;
  status: string;
  createdAt: string;
  listingId?: string;
}

export async function getLeadsForDealer(dealerId?: string): Promise<LeadView[]> {
  if (!isDbEnabled()) {
    return demoStore().leads.map((l) => ({
      id: l.id,
      type: l.type,
      buyerName: l.buyerName ?? "—",
      buyerEmail: l.buyerEmail ?? "",
      buyerPhone: l.buyerPhone ?? "",
      message: l.message ?? "",
      destinationCountry: l.destinationCountry,
      feeAED: l.feeAED,
      status: l.status,
      createdAt: l.createdAt,
      listingId: l.listingId,
    }));
  }
    const baseQuery = db.select().from(leads);
  const rows = await (dealerId
    ? baseQuery.where(eq(leads.dealerId, dealerId))
    : baseQuery
  )
    .orderBy(desc(leads.createdAt))
    .limit(200);
  return rows.map((l) => ({
    id: l.id,
    type: l.type,
    buyerName: l.buyerName ?? "—",
    buyerEmail: l.buyerEmail ?? "",
    buyerPhone: l.buyerPhone ?? "",
    message: l.message ?? "",
    destinationCountry: l.destinationCountry ?? undefined,
    feeAED: l.feeAED,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
    listingId: l.listingId ?? undefined,
  }));
}
