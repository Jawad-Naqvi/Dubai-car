import "server-only";
import { z } from "zod";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import {
  quotes,
  quoteMessages,
  listings,
  dealers,
  users,
} from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import {
  demoStore,
  demoId,
  makeReference,
  type DemoQuote,
} from "./demo-store";
import { mockListings, mockDealers } from "@/lib/mock-data";
import { notify } from "@/lib/notifications";
import {
  quoteRequestedEvent,
  quoteRespondedEvent,
  quoteAcceptedEvent,
  quoteDeclinedEvent,
  quoteMessageEvent,
  type QuoteNotificationContext,
} from "@/lib/notifications/templates";
import { createOrderFromQuote } from "./orders";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

// Status vocabulary lives in a client-safe module (no "server-only") so badge
// components can import it without pulling this DB layer into the browser
// bundle. Re-exported here so existing server-side imports keep working.
export {
  QUOTE_STATUS_LABEL,
  QUOTE_STATUS_LABEL_SELLER,
  type QuoteStatus,
} from "@/lib/quote-status";
import type { QuoteStatus } from "@/lib/quote-status";

export interface QuoteMessageView {
  senderRole: "buyer" | "dealer";
  body: string;
  createdAt: string;
}

export interface QuoteView {
  id: string;
  reference: string;
  listingId?: string;
  listingTitle?: string;
  dealerName: string;
  dealerSlug?: string;
  buyerName?: string;
  buyerCompany?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  quantity: number;
  requirements?: string;
  targetUnitPriceAED?: number;
  destinationCountry?: string;
  quotedUnitPriceAED?: number;
  quotedTotalAED?: number;
  quotedQuantity?: number;
  quotedNotes?: string;
  validUntil?: string;
  respondedAt?: string;
  status: QuoteStatus;
  createdAt: string;
  messages: QuoteMessageView[];
}

export const quoteRequestSchema = z.object({
  listingId: z.string().optional(),
  dealerSlug: z.string().optional(),
  quantity: z.coerce.number().int().min(1).max(999),
  requirements: z.string().max(4000).optional(),
  targetUnitPriceAED: z.coerce.number().int().positive().optional(),
  destinationCountry: z.string().max(64).optional(),
  buyerName: z.string().min(2, "Your name is required").max(160),
  buyerEmail: z.string().email("A valid email is required").max(320),
  buyerPhone: z.string().max(32).optional(),
  buyerCompany: z.string().max(200).optional(),
});
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

export const quoteResponseSchema = z.object({
  quotedUnitPriceAED: z.coerce.number().int().positive(),
  quotedQuantity: z.coerce.number().int().min(1).max(999).optional(),
  quotedNotes: z.string().max(4000).optional(),
  /** Days the pricing stays valid; defaults to 14. */
  validForDays: z.coerce.number().int().min(1).max(90).optional(),
});
export type QuoteResponseInput = z.infer<typeof quoteResponseSchema>;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function demoToView(q: DemoQuote, messages: QuoteMessageView[]): QuoteView {
  return {
    id: q.id,
    reference: q.reference,
    listingId: q.listingId,
    listingTitle: q.listingTitle,
    dealerName: q.dealerName,
    dealerSlug: q.dealerSlug,
    buyerName: q.buyerName,
    buyerCompany: q.buyerCompany,
    buyerEmail: q.buyerEmail,
    buyerPhone: q.buyerPhone,
    quantity: q.quantity,
    requirements: q.requirements,
    targetUnitPriceAED: q.targetUnitPriceAED,
    destinationCountry: q.destinationCountry,
    quotedUnitPriceAED: q.quotedUnitPriceAED,
    quotedTotalAED: q.quotedTotalAED,
    quotedQuantity: q.quotedQuantity,
    quotedNotes: q.quotedNotes,
    validUntil: q.validUntil,
    respondedAt: q.respondedAt,
    status: q.status as QuoteStatus,
    createdAt: q.createdAt,
    messages,
  };
}

function demoMessages(quoteId: string): QuoteMessageView[] {
  return demoStore()
    .quoteMessages.filter((m) => m.quoteId === quoteId)
    .map((m) => ({
      senderRole: m.senderRole,
      body: m.body,
      createdAt: m.createdAt,
    }));
}

/** Build the notification context shared by every quote event. */
function contextFor(
  q: QuoteView,
  extra: { sellerEmail?: string; sellerWhatsapp?: string; sellerUserId?: string; buyerUserId?: string } = {},
): QuoteNotificationContext {
  return {
    reference: q.reference,
    quantity: q.quotedQuantity ?? q.quantity,
    subject: q.listingTitle ?? "bulk vehicle enquiry",
    sellerName: q.dealerName,
    buyerName: q.buyerName,
    buyerCompany: q.buyerCompany,
    requirements: q.requirements,
    quotedUnitPriceAED: q.quotedUnitPriceAED,
    quotedTotalAED: q.quotedTotalAED,
    quotedNotes: q.quotedNotes,
    validUntil: q.validUntil
      ? new Date(q.validUntil).toLocaleDateString("en-GB")
      : null,
    buyer: {
      userId: extra.buyerUserId,
      email: q.buyerEmail,
      whatsapp: q.buyerPhone,
      name: q.buyerName,
    },
    seller: {
      userId: extra.sellerUserId,
      email: extra.sellerEmail,
      whatsapp: extra.sellerWhatsapp,
      name: q.dealerName,
    },
    replyTo: q.buyerEmail,
  };
}

/** Resolve seller contact details for a quote row (DB mode). */
async function sellerContact(quoteId: string): Promise<{
  sellerEmail?: string;
  sellerWhatsapp?: string;
  sellerUserId?: string;
  buyerUserId?: string;
}> {
  if (!isDbEnabled()) return {};
  const dealerUser = alias(users, "quote_dealer_user");
  const sellerUser = alias(users, "quote_seller_user");
  const [row] = await db
    .select({
      dealerEmail: dealerUser.email,
      dealerUserId: dealerUser.id,
      dealerWhatsapp: dealers.whatsapp,
      dealerPhone: dealers.phone,
      sellerEmail: sellerUser.email,
      sellerUserId: sellerUser.id,
      sellerPhone: sellerUser.phone,
      buyerId: quotes.buyerId,
    })
    .from(quotes)
    .leftJoin(dealers, eq(quotes.dealerId, dealers.id))
    .leftJoin(dealerUser, eq(dealers.userId, dealerUser.id))
    .leftJoin(sellerUser, eq(quotes.sellerId, sellerUser.id))
    .where(eq(quotes.id, quoteId))
    .limit(1);
  if (!row) return {};
  return {
    sellerEmail: row.dealerEmail ?? row.sellerEmail ?? undefined,
    sellerWhatsapp:
      row.dealerWhatsapp ?? row.dealerPhone ?? row.sellerPhone ?? undefined,
    sellerUserId: row.dealerUserId ?? row.sellerUserId ?? undefined,
    buyerUserId: row.buyerId ?? undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Create                                                              */
/* ------------------------------------------------------------------ */

export async function createQuoteRequest(
  raw: unknown,
  buyerId?: string,
): Promise<{ id: string; reference: string }> {
  const input = quoteRequestSchema.parse(raw);
  if (!input.listingId && !input.dealerSlug) {
    throw new Error("A quote needs either a listing or a dealer.");
  }

  /* ---------- demo mode ---------- */
  if (!isDbEnabled()) {
    const store = demoStore();
    const listing = input.listingId
      ? [...store.newListings, ...mockListings].find((l) => l.id === input.listingId)
      : undefined;
    const dealer = listing
      ? listing.dealer
      : mockDealers.find((d) => d.slug === input.dealerSlug);
    const quote: DemoQuote = {
      id: demoId("QT"),
      reference: makeReference("QT"),
      listingId: listing?.id,
      listingTitle: listing
        ? `${listing.year} ${listing.make} ${listing.model}`
        : undefined,
      dealerSlug: dealer?.slug,
      dealerName: dealer?.name ?? "DXB Motors partner",
      buyerId,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      buyerPhone: input.buyerPhone,
      buyerCompany: input.buyerCompany,
      quantity: input.quantity,
      requirements: input.requirements,
      targetUnitPriceAED: input.targetUnitPriceAED,
      destinationCountry: input.destinationCountry,
      status: "requested",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.quotes.unshift(quote);
    void notify(quoteRequestedEvent(contextFor(demoToView(quote, []))));
    return { id: quote.id, reference: quote.reference };
  }

  /* ---------- DB mode ---------- */
  let dealerId: string | undefined;
  let sellerId: string | undefined;
  let listingTitle: string | undefined;

  if (input.listingId) {
    const [l] = await db
      .select({
        dealerId: listings.dealerId,
        sellerId: listings.sellerId,
        make: listings.make,
        model: listings.model,
        year: listings.year,
      })
      .from(listings)
      .where(eq(listings.id, input.listingId))
      .limit(1);
    if (l) {
      dealerId = l.dealerId ?? undefined;
      sellerId = l.sellerId ?? undefined;
      listingTitle = `${l.year} ${l.make} ${l.model}`;
    }
  } else if (input.dealerSlug) {
    const [d] = await db
      .select({ id: dealers.id })
      .from(dealers)
      .where(eq(dealers.slug, input.dealerSlug))
      .limit(1);
    dealerId = d?.id;
  }

  const reference = makeReference("QT");
  const [row] = await db
    .insert(quotes)
    .values({
      reference,
      listingId: input.listingId,
      dealerId,
      sellerId,
      buyerId,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      buyerPhone: input.buyerPhone,
      buyerCompany: input.buyerCompany,
      quantity: input.quantity,
      requirements: input.requirements,
      targetUnitPriceAED: input.targetUnitPriceAED,
      destinationCountry: input.destinationCountry,
      status: "requested",
    })
    .returning({ id: quotes.id });

  const dealerName = dealerId
    ? (
        await db
          .select({ name: dealers.businessName })
          .from(dealers)
          .where(eq(dealers.id, dealerId))
          .limit(1)
      )[0]?.name
    : undefined;

  const contacts = await sellerContact(row.id);
  void notify(
    quoteRequestedEvent(
      contextFor(
        {
          id: row.id,
          reference,
          listingId: input.listingId,
          listingTitle,
          dealerName: dealerName ?? "the seller",
          buyerName: input.buyerName,
          buyerCompany: input.buyerCompany,
          buyerEmail: input.buyerEmail,
          buyerPhone: input.buyerPhone,
          quantity: input.quantity,
          requirements: input.requirements,
          status: "requested",
          createdAt: new Date().toISOString(),
          messages: [],
        },
        contacts,
      ),
    ),
  );

  return { id: row.id, reference };
}

/* ------------------------------------------------------------------ */
/* Read                                                                */
/* ------------------------------------------------------------------ */

async function dbQuotesWhere(
  clause: ReturnType<typeof eq> | undefined,
): Promise<QuoteView[]> {
  const rows = await db
    .select({
      q: quotes,
      dealerName: dealers.businessName,
      dealerSlug: dealers.slug,
      make: listings.make,
      model: listings.model,
      year: listings.year,
    })
    .from(quotes)
    .leftJoin(dealers, eq(quotes.dealerId, dealers.id))
    .leftJoin(listings, eq(quotes.listingId, listings.id))
    .where(clause)
    .orderBy(desc(quotes.createdAt))
    .limit(200);

  const ids = rows.map((r) => r.q.id);
  const msgMap = new Map<string, QuoteMessageView[]>();
  if (ids.length) {
    const msgs = await db
      .select()
      .from(quoteMessages)
      .where(inArray(quoteMessages.quoteId, ids))
      .orderBy(quoteMessages.createdAt);
    for (const m of msgs) {
      const arr = msgMap.get(m.quoteId) ?? [];
      arr.push({
        senderRole: m.senderRole as "buyer" | "dealer",
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      });
      msgMap.set(m.quoteId, arr);
    }
  }

  return rows.map((r) => ({
    id: r.q.id,
    reference: r.q.reference,
    listingId: r.q.listingId ?? undefined,
    listingTitle: r.make ? `${r.year} ${r.make} ${r.model}` : undefined,
    dealerName: r.dealerName ?? "Private seller",
    dealerSlug: r.dealerSlug ?? undefined,
    buyerName: r.q.buyerName ?? undefined,
    buyerCompany: r.q.buyerCompany ?? undefined,
    buyerEmail: r.q.buyerEmail ?? undefined,
    buyerPhone: r.q.buyerPhone ?? undefined,
    quantity: r.q.quantity,
    requirements: r.q.requirements ?? undefined,
    targetUnitPriceAED: r.q.targetUnitPriceAED ?? undefined,
    destinationCountry: r.q.destinationCountry ?? undefined,
    quotedUnitPriceAED: r.q.quotedUnitPriceAED ?? undefined,
    quotedTotalAED: r.q.quotedTotalAED ?? undefined,
    quotedQuantity: r.q.quotedQuantity ?? undefined,
    quotedNotes: r.q.quotedNotes ?? undefined,
    validUntil: r.q.validUntil?.toISOString(),
    respondedAt: r.q.respondedAt?.toISOString(),
    status: r.q.status as QuoteStatus,
    createdAt: r.q.createdAt.toISOString(),
    messages: msgMap.get(r.q.id) ?? [],
  }));
}

export async function getQuotesForBuyer(buyerId: string): Promise<QuoteView[]> {
  if (!isDbEnabled()) {
    return demoStore()
      .quotes.filter((q) => !q.buyerId || q.buyerId === buyerId)
      .map((q) => demoToView(q, demoMessages(q.id)));
  }
  try {
    return await dbQuotesWhere(eq(quotes.buyerId, buyerId));
  } catch {
    return [];
  }
}

export async function getQuotesForDealer(
  dealerId?: string,
  sellerId?: string,
): Promise<QuoteView[]> {
  if (!isDbEnabled()) {
    return demoStore().quotes.map((q) => demoToView(q, demoMessages(q.id)));
  }
  try {
    if (!dealerId && !sellerId) return [];
    const clause =
      dealerId && sellerId
        ? or(eq(quotes.dealerId, dealerId), eq(quotes.sellerId, sellerId))
        : dealerId
          ? eq(quotes.dealerId, dealerId)
          : eq(quotes.sellerId, sellerId!);
    return await dbQuotesWhere(clause as ReturnType<typeof eq>);
  } catch {
    return [];
  }
}

export async function getQuoteById(id: string): Promise<QuoteView | null> {
  if (!isDbEnabled()) {
    const q = demoStore().quotes.find((x) => x.id === id || x.reference === id);
    return q ? demoToView(q, demoMessages(q.id)) : null;
  }
  try {
    const rows = await dbQuotesWhere(eq(quotes.id, id));
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Transitions                                                         */
/* ------------------------------------------------------------------ */

/** Dealer prices the request. Moves requested/under_review → responded. */
export async function respondToQuote(
  id: string,
  raw: unknown,
): Promise<QuoteView | null> {
  const input = quoteResponseSchema.parse(raw);
  const now = new Date();
  const validUntil = new Date(
    now.getTime() + (input.validForDays ?? 14) * 86_400_000,
  );

  if (!isDbEnabled()) {
    const q = demoStore().quotes.find((x) => x.id === id || x.reference === id);
    if (!q) return null;
    const qty = input.quotedQuantity ?? q.quantity;
    q.quotedUnitPriceAED = input.quotedUnitPriceAED;
    q.quotedQuantity = qty;
    q.quotedTotalAED = input.quotedUnitPriceAED * qty;
    q.quotedNotes = input.quotedNotes;
    q.validUntil = validUntil.toISOString();
    q.respondedAt = now.toISOString();
    q.status = "responded";
    q.updatedAt = now.toISOString();
    const view = demoToView(q, demoMessages(q.id));
    void notify(quoteRespondedEvent(contextFor(view)));
    return view;
  }

  const existing = await getQuoteById(id);
  if (!existing) return null;
  const qty = input.quotedQuantity ?? existing.quantity;
  await db
    .update(quotes)
    .set({
      quotedUnitPriceAED: input.quotedUnitPriceAED,
      quotedQuantity: qty,
      quotedTotalAED: input.quotedUnitPriceAED * qty,
      quotedNotes: input.quotedNotes,
      validUntil,
      respondedAt: now,
      status: "responded",
      updatedAt: now,
    })
    .where(eq(quotes.id, id));

  const view = await getQuoteById(id);
  if (view) {
    void notify(quoteRespondedEvent(contextFor(view, await sellerContact(id))));
  }
  return view;
}

/**
 * Buyer accepts the priced quote. This is the hand-off point where the B2B
 * journey rejoins the shared order pipeline — an order is created immediately
 * so "quote accepted" is never a dead end.
 */
export async function acceptQuote(
  id: string,
  buyerId?: string,
): Promise<{ quote: QuoteView; orderReference: string } | null> {
  const quote = await getQuoteById(id);
  if (!quote) return null;
  if (quote.status !== "responded") {
    throw new Error("Only a priced quote can be accepted.");
  }

  const now = new Date();
  if (!isDbEnabled()) {
    const q = demoStore().quotes.find((x) => x.id === quote.id);
    if (q) {
      q.status = "accepted";
      q.updatedAt = now.toISOString();
    }
  } else {
    await db
      .update(quotes)
      .set({ status: "accepted", updatedAt: now })
      .where(eq(quotes.id, quote.id));
  }

  const order = await createOrderFromQuote(quote, buyerId);
  const accepted = { ...quote, status: "accepted" as QuoteStatus };
  const contacts = isDbEnabled() ? await sellerContact(quote.id) : {};
  void notify(
    quoteAcceptedEvent({
      ...contextFor(accepted, contacts),
      orderReference: order.reference,
    }),
  );

  return { quote: accepted, orderReference: order.reference };
}

/** Either side can decline; `by` decides who gets told what. */
export async function declineQuote(
  id: string,
  by: "buyer" | "seller",
  reason?: string,
): Promise<QuoteView | null> {
  const quote = await getQuoteById(id);
  if (!quote) return null;
  const now = new Date();
  const status: QuoteStatus = by === "buyer" ? "withdrawn" : "declined";

  if (!isDbEnabled()) {
    const q = demoStore().quotes.find((x) => x.id === quote.id);
    if (q) {
      q.status = status;
      q.updatedAt = now.toISOString();
      if (reason) q.quotedNotes = reason;
    }
  } else {
    await db
      .update(quotes)
      .set({ status, updatedAt: now, ...(reason ? { quotedNotes: reason } : {}) })
      .where(eq(quotes.id, quote.id));
  }

  const updated = { ...quote, status };
  const contacts = isDbEnabled() ? await sellerContact(quote.id) : {};
  void notify(
    quoteDeclinedEvent({ ...contextFor(updated, contacts), by, reason }),
  );
  return updated;
}

/** Post a message on the negotiation thread and ping the other party. */
export async function addQuoteMessage(
  id: string,
  from: "buyer" | "dealer",
  body: string,
): Promise<QuoteMessageView | null> {
  const quote = await getQuoteById(id);
  if (!quote) return null;
  const createdAt = new Date();

  if (!isDbEnabled()) {
    demoStore().quoteMessages.push({
      id: demoId("QMSG"),
      quoteId: quote.id,
      senderRole: from,
      body,
      createdAt: createdAt.toISOString(),
    });
  } else {
    await db
      .insert(quoteMessages)
      .values({ quoteId: quote.id, senderRole: from, body });
  }

  const contacts = isDbEnabled() ? await sellerContact(quote.id) : {};
  void notify(
    quoteMessageEvent({
      ...contextFor(quote, contacts),
      from: from === "dealer" ? "seller" : "buyer",
      message: body,
    }),
  );

  return { senderRole: from, body, createdAt: createdAt.toISOString() };
}

/** Dealer opens a request — flips "requested" to "under_review" (no notify). */
export async function markQuoteUnderReview(id: string): Promise<void> {
  if (!isDbEnabled()) {
    const q = demoStore().quotes.find((x) => x.id === id || x.reference === id);
    if (q && q.status === "requested") q.status = "under_review";
    return;
  }
  await db
    .update(quotes)
    .set({ status: "under_review", updatedAt: new Date() })
    .where(and(eq(quotes.id, id), eq(quotes.status, "requested")));
}
