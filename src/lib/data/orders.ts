import "server-only";
import { z } from "zod";
import { desc, eq, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { orders, quotes, listings, dealers, users } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { demoStore, demoId, makeReference, type DemoOrder } from "./demo-store";
import { mockListings } from "@/lib/mock-data";
import { notify } from "@/lib/notifications";
import {
  orderCreatedEvent,
  orderStatusChangedEvent,
} from "@/lib/notifications/templates";
import type { QuoteView } from "./quotes";

// Status vocabulary lives in a client-safe module (no "server-only") so badge
// components can import it without pulling this DB layer into the browser
// bundle. Re-exported here so existing server-side imports keep working.
export { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/quote-status";
import type { OrderStatus } from "@/lib/quote-status";

export interface OrderView {
  id: string;
  reference: string;
  quoteId?: string;
  listingId?: string;
  dealerName: string;
  dealerSlug?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  kind: "retail" | "bulk";
  title: string;
  quantity: number;
  unitPriceAED: number;
  totalAED: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
}

export const orderCreateSchema = z.object({
  listingId: z.string().min(1, "A listing is required"),
  quantity: z.coerce.number().int().min(1).max(999).optional(),
  buyerName: z.string().min(2).max(160),
  buyerEmail: z.string().email().max(320),
  buyerPhone: z.string().max(32).optional(),
  notes: z.string().max(4000).optional(),
});

function demoToView(o: DemoOrder): OrderView {
  return {
    id: o.id,
    reference: o.reference,
    quoteId: o.quoteId,
    listingId: o.listingId,
    dealerName: o.dealerName,
    dealerSlug: o.dealerSlug,
    buyerName: o.buyerName,
    buyerEmail: o.buyerEmail,
    buyerPhone: o.buyerPhone,
    kind: o.kind,
    title: o.title,
    quantity: o.quantity,
    unitPriceAED: o.unitPriceAED,
    totalAED: o.totalAED,
    status: o.status as OrderStatus,
    notes: o.notes,
    createdAt: o.createdAt,
  };
}

/** Seller contact lookup for order notifications (DB mode). */
async function sellerContactForOrder(orderId: string) {
  if (!isDbEnabled()) return {};
  const dealerUser = alias(users, "order_dealer_user");
  const sellerUser = alias(users, "order_seller_user");
  const [row] = await db
    .select({
      dealerEmail: dealerUser.email,
      dealerUserId: dealerUser.id,
      dealerWhatsapp: dealers.whatsapp,
      dealerPhone: dealers.phone,
      sellerEmail: sellerUser.email,
      sellerUserId: sellerUser.id,
      sellerPhone: sellerUser.phone,
      buyerId: orders.buyerId,
    })
    .from(orders)
    .leftJoin(dealers, eq(orders.dealerId, dealers.id))
    .leftJoin(dealerUser, eq(dealers.userId, dealerUser.id))
    .leftJoin(sellerUser, eq(orders.sellerId, sellerUser.id))
    .where(eq(orders.id, orderId))
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

/** B2B path: an accepted quote becomes an order. */
export async function createOrderFromQuote(
  quote: QuoteView,
  buyerId?: string,
): Promise<OrderView> {
  const quantity = quote.quotedQuantity ?? quote.quantity;
  const unitPrice = quote.quotedUnitPriceAED ?? 0;
  const total = quote.quotedTotalAED ?? unitPrice * quantity;
  const reference = makeReference("OR");
  const title = quote.listingTitle ?? "Bulk vehicle order";

  if (!isDbEnabled()) {
    const order: DemoOrder = {
      id: demoId("OR"),
      reference,
      quoteId: quote.id,
      listingId: quote.listingId,
      dealerName: quote.dealerName,
      dealerSlug: quote.dealerSlug,
      buyerId,
      buyerName: quote.buyerName,
      buyerEmail: quote.buyerEmail,
      buyerPhone: quote.buyerPhone,
      kind: "bulk",
      title,
      quantity,
      unitPriceAED: unitPrice,
      totalAED: total,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    demoStore().orders.unshift(order);
    return demoToView(order);
  }

  const [src] = await db
    .select({ dealerId: quotes.dealerId, sellerId: quotes.sellerId })
    .from(quotes)
    .where(eq(quotes.id, quote.id))
    .limit(1);

  const [row] = await db
    .insert(orders)
    .values({
      reference,
      quoteId: quote.id,
      listingId: quote.listingId,
      dealerId: src?.dealerId,
      sellerId: src?.sellerId,
      buyerId,
      buyerName: quote.buyerName,
      buyerEmail: quote.buyerEmail,
      buyerPhone: quote.buyerPhone,
      kind: "bulk",
      title,
      quantity,
      unitPriceAED: unitPrice,
      totalAED: total,
      status: "pending",
    })
    .returning({ id: orders.id });

  return {
    id: row.id,
    reference,
    quoteId: quote.id,
    listingId: quote.listingId,
    dealerName: quote.dealerName,
    dealerSlug: quote.dealerSlug,
    buyerName: quote.buyerName,
    buyerEmail: quote.buyerEmail,
    buyerPhone: quote.buyerPhone,
    kind: "bulk",
    title,
    quantity,
    unitPriceAED: unitPrice,
    totalAED: total,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
}

/**
 * B2C path: a buyer reserves a single priced car. Same table, same dealer
 * pipeline — the only difference is `kind` and the wording buyers see.
 */
export async function createRetailOrder(
  raw: unknown,
  buyerId?: string,
): Promise<OrderView> {
  const input = orderCreateSchema.parse(raw);
  const reference = makeReference("OR");
  const quantity = input.quantity ?? 1;

  if (!isDbEnabled()) {
    const store = demoStore();
    const listing = [...store.newListings, ...mockListings].find(
      (l) => l.id === input.listingId,
    );
    if (!listing) throw new Error("Listing not found.");
    const order: DemoOrder = {
      id: demoId("OR"),
      reference,
      listingId: listing.id,
      dealerName: listing.dealer.name,
      dealerSlug: listing.dealer.slug,
      buyerId,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      buyerPhone: input.buyerPhone,
      kind: "retail",
      title: `${listing.year} ${listing.make} ${listing.model}`,
      quantity,
      unitPriceAED: listing.priceAED,
      totalAED: listing.priceAED * quantity,
      status: "pending",
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.orders.unshift(order);
    const view = demoToView(order);
    void notify(
      orderCreatedEvent({
        reference: view.reference,
        subject: view.title,
        quantity: view.quantity,
        totalAED: view.totalAED,
        sellerName: view.dealerName,
        buyerName: view.buyerName,
        buyer: { email: view.buyerEmail, whatsapp: view.buyerPhone },
        seller: { whatsapp: listing.dealer.whatsapp ?? listing.dealer.phone },
        replyTo: view.buyerEmail,
      }),
    );
    return view;
  }

  const [l] = await db
    .select({
      dealerId: listings.dealerId,
      sellerId: listings.sellerId,
      make: listings.make,
      model: listings.model,
      year: listings.year,
      price: listings.priceAED,
    })
    .from(listings)
    .where(eq(listings.id, input.listingId))
    .limit(1);
  if (!l) throw new Error("Listing not found.");

  const title = `${l.year} ${l.make} ${l.model}`;
  const [row] = await db
    .insert(orders)
    .values({
      reference,
      listingId: input.listingId,
      dealerId: l.dealerId,
      sellerId: l.sellerId,
      buyerId,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      buyerPhone: input.buyerPhone,
      kind: "retail",
      title,
      quantity,
      unitPriceAED: l.price,
      totalAED: l.price * quantity,
      status: "pending",
      notes: input.notes,
    })
    .returning({ id: orders.id });

  const dealerName = l.dealerId
    ? (
        await db
          .select({ name: dealers.businessName })
          .from(dealers)
          .where(eq(dealers.id, l.dealerId))
          .limit(1)
      )[0]?.name
    : undefined;

  const contacts = await sellerContactForOrder(row.id);
  void notify(
    orderCreatedEvent({
      reference,
      subject: title,
      quantity,
      totalAED: l.price * quantity,
      sellerName: dealerName ?? "the seller",
      buyerName: input.buyerName,
      buyer: {
        userId: buyerId,
        email: input.buyerEmail,
        whatsapp: input.buyerPhone,
      },
      seller: {
        userId: contacts.sellerUserId,
        email: contacts.sellerEmail,
        whatsapp: contacts.sellerWhatsapp,
      },
      replyTo: input.buyerEmail,
    }),
  );

  return {
    id: row.id,
    reference,
    listingId: input.listingId,
    dealerName: dealerName ?? "Seller",
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    buyerPhone: input.buyerPhone,
    kind: "retail",
    title,
    quantity,
    unitPriceAED: l.price,
    totalAED: l.price * quantity,
    status: "pending",
    notes: input.notes,
    createdAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* Read + transitions                                                  */
/* ------------------------------------------------------------------ */

async function dbOrdersWhere(clause: ReturnType<typeof eq>): Promise<OrderView[]> {
  const rows = await db
    .select({
      o: orders,
      dealerName: dealers.businessName,
      dealerSlug: dealers.slug,
    })
    .from(orders)
    .leftJoin(dealers, eq(orders.dealerId, dealers.id))
    .where(clause)
    .orderBy(desc(orders.createdAt))
    .limit(200);
  return rows.map((r) => ({
    id: r.o.id,
    reference: r.o.reference,
    quoteId: r.o.quoteId ?? undefined,
    listingId: r.o.listingId ?? undefined,
    dealerName: r.dealerName ?? "Private seller",
    dealerSlug: r.dealerSlug ?? undefined,
    buyerName: r.o.buyerName ?? undefined,
    buyerEmail: r.o.buyerEmail ?? undefined,
    buyerPhone: r.o.buyerPhone ?? undefined,
    kind: (r.o.kind as "retail" | "bulk") ?? "retail",
    title: r.o.title ?? "Vehicle order",
    quantity: r.o.quantity,
    unitPriceAED: r.o.unitPriceAED,
    totalAED: r.o.totalAED,
    status: r.o.status as OrderStatus,
    notes: r.o.notes ?? undefined,
    createdAt: r.o.createdAt.toISOString(),
  }));
}

export async function getOrdersForBuyer(buyerId: string): Promise<OrderView[]> {
  if (!isDbEnabled()) {
    return demoStore()
      .orders.filter((o) => !o.buyerId || o.buyerId === buyerId)
      .map(demoToView);
  }
  try {
    return await dbOrdersWhere(eq(orders.buyerId, buyerId));
  } catch {
    return [];
  }
}

export async function getOrdersForDealer(
  dealerId?: string,
  sellerId?: string,
): Promise<OrderView[]> {
  if (!isDbEnabled()) return demoStore().orders.map(demoToView);
  try {
    if (!dealerId && !sellerId) return [];
    const clause =
      dealerId && sellerId
        ? or(eq(orders.dealerId, dealerId), eq(orders.sellerId, sellerId))
        : dealerId
          ? eq(orders.dealerId, dealerId)
          : eq(orders.sellerId, sellerId!);
    return await dbOrdersWhere(clause as ReturnType<typeof eq>);
  } catch {
    return [];
  }
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<OrderView | null> {
  const now = new Date();
  let view: OrderView | null = null;

  if (!isDbEnabled()) {
    const o = demoStore().orders.find((x) => x.id === id || x.reference === id);
    if (!o) return null;
    o.status = status;
    o.updatedAt = now.toISOString();
    view = demoToView(o);
  } else {
    await db
      .update(orders)
      .set({ status, updatedAt: now })
      .where(eq(orders.id, id));
    const rows = await dbOrdersWhere(eq(orders.id, id));
    view = rows[0] ?? null;
  }

  if (view) {
    const contacts = isDbEnabled() ? await sellerContactForOrder(view.id) : {};
    void notify(
      orderStatusChangedEvent({
        reference: view.reference,
        subject: view.title,
        quantity: view.quantity,
        totalAED: view.totalAED,
        sellerName: view.dealerName,
        buyerName: view.buyerName,
        status,
        buyer: {
          userId: contacts.buyerUserId,
          email: view.buyerEmail,
          whatsapp: view.buyerPhone,
        },
        seller: {},
      }),
    );
  }
  return view;
}
