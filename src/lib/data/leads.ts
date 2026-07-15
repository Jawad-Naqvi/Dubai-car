import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, listings, dealers, type Lead } from "@/lib/db/schema";
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

/** A buyer-facing message thread (one row per lead the buyer opened). */
export interface MessageThread {
  id: string;
  type: string;
  status: string;
  message: string;
  createdAt: string;
  listingTitle?: string;
  dealerName?: string;
}

/**
 * Message threads for a signed-in buyer: their own leads, newest first, with
 * listing (make/model/year) and dealer name joined for context. Read-only —
 * new messages are created via the lead form on listing pages. Falls back to a
 * few sample threads in demo mode so the page always renders.
 */
export async function getMessagesForUser(userId: string): Promise<MessageThread[]> {
  if (!isDbEnabled()) {
    const now = Date.now();
    return [
      {
        id: "MSG-1",
        type: "inquiry",
        status: "new",
        message: "Hi, is this still available? Can I come see it this weekend?",
        createdAt: new Date(now - 2 * 3600_000).toISOString(),
        listingTitle: "2022 BMW X5 xDrive40i",
        dealerName: "Al Habtoor Motors",
      },
      {
        id: "MSG-2",
        type: "test_drive",
        status: "contacted",
        message: "Requested a test drive for Saturday afternoon.",
        createdAt: new Date(now - 26 * 3600_000).toISOString(),
        listingTitle: "2021 Mercedes-Benz C 300",
        dealerName: "Deals on Wheels",
      },
      {
        id: "MSG-3",
        type: "contact_unlock",
        status: "closed",
        message: "Unlocked seller contact details.",
        createdAt: new Date(now - 5 * 24 * 3600_000).toISOString(),
        listingTitle: "2020 Toyota Land Cruiser GXR",
        dealerName: "Gargash Motors",
      },
    ];
  }
  try {
    const rows = await db
      .select({
        id: leads.id,
        type: leads.type,
        status: leads.status,
        message: leads.message,
        createdAt: leads.createdAt,
        make: listings.make,
        model: listings.model,
        year: listings.year,
        dealerName: dealers.businessName,
      })
      .from(leads)
      .leftJoin(listings, eq(leads.listingId, listings.id))
      .leftJoin(dealers, eq(leads.dealerId, dealers.id))
      .where(eq(leads.buyerId, userId))
      .orderBy(desc(leads.createdAt))
      .limit(100);
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      status: r.status,
      message: r.message ?? "",
      createdAt: r.createdAt.toISOString(),
      listingTitle: r.make ? `${r.year} ${r.make} ${r.model}` : undefined,
      dealerName: r.dealerName ?? undefined,
    }));
  } catch {
    return [];
  }
}
