import "server-only";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { leads, listings, dealers, users, leadReplies, type Lead } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { isAdminAllowed } from "@/lib/data/users";
import { demoStore, demoId, type DemoLead } from "./demo-store";
import { sendLeadNotification, sendEmail } from "@/lib/notify";
import { getOrCreateConversation } from "@/lib/data/chat";
import { conversations, messages as chatMessages } from "@/lib/db/schema";
import { sendWhatsApp } from "@/lib/whatsapp";

const LEAD_TYPE_LABEL: Record<string, string> = {
  inquiry: "enquiry",
  test_drive: "test-drive request",
  contact_unlock: "contact unlock",
  export_inquiry: "export enquiry",
  finance_preapproval: "finance pre-approval request",
};

/** Build the seller/dealer notification for a new lead. */
function buildLeadEmail(opts: {
  to?: string;
  type: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  message?: string;
  listingTitle?: string;
}) {
  const label = LEAD_TYPE_LABEL[opts.type] ?? "enquiry";
  const car = opts.listingTitle ? ` on ${opts.listingTitle}` : "";
  const lines = [
    `You have a new ${label}${car}.`,
    "",
    `Buyer:  ${opts.buyerName ?? "—"}`,
    `Phone:  ${opts.buyerPhone ?? "—"}`,
    `Email:  ${opts.buyerEmail ?? "—"}`,
    opts.message ? `\nMessage:\n${opts.message}` : "",
    "",
    "Reply to this email to reach the buyer directly, or open your dashboard:",
    "https://dxbmotors.ae/dashboard/leads",
  ];
  return {
    to: opts.to,
    replyTo: opts.buyerEmail,
    subject: `New ${label}${car} — ${opts.buyerName ?? "a buyer"}`,
    body: lines.filter((l) => l !== undefined).join("\n"),
  };
}

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
    void sendLeadNotification(
      buildLeadEmail({
        type,
        buyerName: input.buyerName,
        buyerEmail: input.buyerEmail,
        buyerPhone: input.buyerPhone,
        message: input.message,
      }),
    );
    return { id: lead.id };
  }

  // Look up the listing's dealer/seller + price for routing, fee calc, and to
  // notify the RIGHT recipient (dealer's account email, or the private
  // seller's email — falling back to LEADS_NOTIFY_EMAIL so leads never vanish).
  let dealerId = input.dealerId;
  let price: number | undefined;
  let recipientEmail: string | undefined;
  let recipientWhatsapp: string | undefined;
  let listingTitle: string | undefined;
  // Who owns the car — needed to open a two-party conversation on the enquiry.
  let sellerUserId: string | undefined;
  if (input.listingId) {
    const dealerUser = alias(users, "dealer_user");
    const sellerUser = alias(users, "seller_user");
    const l = await db
      .select({
        dealerId: listings.dealerId,
        price: listings.priceAED,
        make: listings.make,
        model: listings.model,
        year: listings.year,
        dealerEmail: dealerUser.email,
        sellerEmail: sellerUser.email,
        dealerWhatsapp: dealers.whatsapp,
        dealerPhone: dealers.phone,
        sellerPhone: sellerUser.phone,
        dealerUserId: dealerUser.id,
        sellerUserId: sellerUser.id,
      })
      .from(listings)
      .leftJoin(dealers, eq(listings.dealerId, dealers.id))
      .leftJoin(dealerUser, eq(dealers.userId, dealerUser.id))
      .leftJoin(sellerUser, eq(listings.sellerId, sellerUser.id))
      .where(eq(listings.id, input.listingId))
      .limit(1);
    if (l[0]) {
      dealerId = dealerId ?? l[0].dealerId ?? undefined;
      price = l[0].price;
      recipientEmail = l[0].dealerEmail ?? l[0].sellerEmail ?? undefined;
      recipientWhatsapp =
        l[0].dealerWhatsapp ?? l[0].dealerPhone ?? l[0].sellerPhone ?? undefined;
      listingTitle = `${l[0].year} ${l[0].make} ${l[0].model}`;
      sellerUserId = l[0].dealerUserId ?? l[0].sellerUserId ?? undefined;
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

  void sendLeadNotification(
    buildLeadEmail({
      to: recipientEmail,
      type,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      buyerPhone: input.buyerPhone,
      message: input.message,
      listingTitle,
    }),
  );

  // Same alert over WhatsApp (fires only when the seller has a number and the
  // WhatsApp Cloud API is configured; otherwise it logs and no-ops).
  void sendWhatsApp({
    to: recipientWhatsapp,
    body: buildLeadWhatsApp({
      type,
      buyerName: input.buyerName,
      buyerPhone: input.buyerPhone,
      buyerEmail: input.buyerEmail,
      message: input.message,
      listingTitle,
    }),
    label: "new lead",
  });

  // Open the durable thread for this enquiry. The lead is the transaction
  // record; the conversation is where the two of them actually talk, and it is
  // the same inbox the buyer uses for every other vendor they message.
  if (input.buyerId && sellerUserId && input.buyerId !== sellerUserId) {
    try {
      const conversationId = await getOrCreateConversation({
        kind: "listing",
        subjectId: row.id,
        title: listingTitle ?? "Vehicle enquiry",
        participants: [
          { userId: input.buyerId, role: "buyer" },
          { userId: sellerUserId, role: "dealer" },
        ],
      });
      if (conversationId && input.message?.trim()) {
        await seedFirstMessage(conversationId, input.buyerId, input.message.trim());
      }
    } catch {
      // A chat failure must never lose the lead itself.
    }
  }

  return { id: row.id };
}

/** Short WhatsApp text for a new lead. */
function buildLeadWhatsApp(opts: {
  type: string;
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  message?: string;
  listingTitle?: string;
}): string {
  const label = LEAD_TYPE_LABEL[opts.type] ?? "enquiry";
  const lines = [
    `🚗 New ${label} on DXB Motors${opts.listingTitle ? ` — ${opts.listingTitle}` : ""}`,
    `From: ${opts.buyerName ?? "A buyer"}${opts.buyerPhone ? ` · ${opts.buyerPhone}` : ""}${opts.buyerEmail ? ` · ${opts.buyerEmail}` : ""}`,
  ];
  if (opts.message) lines.push(`"${opts.message}"`);
  lines.push("Open your dashboard → Leads to reply.");
  return lines.join("\n");
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

export interface LeadReplyView {
  senderRole: "buyer" | "dealer";
  body: string;
  createdAt: string;
}

/** Who can see/reply to a lead, and where to email the *other* party. */
export interface LeadOwnership {
  buyerId?: string;
  dealerId?: string;
  buyerEmail?: string;
  dealerEmail?: string;
  listingTitle?: string;
}

export async function getLeadOwnership(id: string): Promise<LeadOwnership | null> {
  if (!isDbEnabled()) {
    const lead = demoStore().leads.find((l) => l.id === id);
    if (!lead) return null;
    return { buyerEmail: lead.buyerEmail };
  }
  const dealerUser = alias(users, "dealer_user_lookup");
  const [row] = await db
    .select({
      buyerId: leads.buyerId,
      dealerId: leads.dealerId,
      buyerEmail: leads.buyerEmail,
      dealerEmail: dealerUser.email,
      make: listings.make,
      model: listings.model,
      year: listings.year,
    })
    .from(leads)
    .leftJoin(dealers, eq(leads.dealerId, dealers.id))
    .leftJoin(dealerUser, eq(dealers.userId, dealerUser.id))
    .leftJoin(listings, eq(leads.listingId, listings.id))
    .where(eq(leads.id, id))
    .limit(1);
  if (!row) return null;
  return {
    buyerId: row.buyerId ?? undefined,
    dealerId: row.dealerId ?? undefined,
    buyerEmail: row.buyerEmail ?? undefined,
    dealerEmail: row.dealerEmail ?? undefined,
    listingTitle: row.make ? `${row.year} ${row.make} ${row.model}` : undefined,
  };
}

/** Post a reply on a lead thread and notify the other party by email. */
export async function addLeadReply(
  leadId: string,
  senderRole: "buyer" | "dealer",
  body: string,
): Promise<void> {
  if (!isDbEnabled()) {
    demoStore().leadReplies.push({
      id: demoId("REPLY"),
      leadId,
      senderRole,
      body,
      createdAt: new Date().toISOString(),
    });
  } else {
    await db.insert(leadReplies).values({ leadId, senderRole, body });
  }

  const ownership = await getLeadOwnership(leadId);
  if (!ownership) return;
  const to = senderRole === "dealer" ? ownership.buyerEmail : ownership.dealerEmail;
  if (!to) return;
  await sendEmail({
    to,
    subject: `New reply on your ${ownership.listingTitle ?? "listing"} enquiry`,
    body: `${body}\n\n— sent via DXB Motors, reply to this thread from your dashboard.`,
    label: "lead reply",
  });
}

async function getRepliesFor(leadIds: string[]): Promise<Map<string, LeadReplyView[]>> {
  const map = new Map<string, LeadReplyView[]>();
  if (leadIds.length === 0) return map;
  if (!isDbEnabled()) {
    for (const r of demoStore().leadReplies) {
      if (!leadIds.includes(r.leadId)) continue;
      const arr = map.get(r.leadId) ?? [];
      arr.push({ senderRole: r.senderRole, body: r.body, createdAt: r.createdAt });
      map.set(r.leadId, arr);
    }
    return map;
  }
  const rows = await db
    .select()
    .from(leadReplies)
    .where(inArray(leadReplies.leadId, leadIds))
    .orderBy(leadReplies.createdAt);
  for (const r of rows) {
    const arr = map.get(r.leadId) ?? [];
    arr.push({
      senderRole: r.senderRole as "buyer" | "dealer",
      body: r.body,
      createdAt: r.createdAt.toISOString(),
    });
    map.set(r.leadId, arr);
  }
  return map;
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
  replies: LeadReplyView[];
}

/**
 * Leads for a seller. Dealers scope by `dealerId`; private sellers have no
 * dealer record, so they scope by `sellerId` — the owner of the listing the
 * lead was raised on. Passing neither returns everything (admin views only).
 */
export async function getLeadsForDealer(
  dealerId?: string,
  sellerId?: string,
): Promise<LeadView[]> {
  if (!isDbEnabled()) {
    const replyMap = await getRepliesFor(demoStore().leads.map((l) => l.id));
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
      replies: replyMap.get(l.id) ?? [],
    }));
  }
  // Private sellers own listings, not a dealer record — scope through the
  // listing so one seller can never see another's leads.
  const scope = dealerId
    ? eq(leads.dealerId, dealerId)
    : sellerId
      ? inArray(
          leads.listingId,
          db
            .select({ id: listings.id })
            .from(listings)
            .where(eq(listings.sellerId, sellerId)),
        )
      : // SECURITY: neither a dealer nor a seller identity was supplied, so
        // there is no owner to scope to. Deny rather than fall through to an
        // unfiltered query — `.where(undefined)` returns EVERY dealer's leads
        // (buyer names, emails, phones) to whoever asked. Admins that really
        // want the global view call getAllLeadsForAdmin(), which says so.
        sql`false`;

  const rows = await db
    .select()
    .from(leads)
    .where(scope)
    .orderBy(desc(leads.createdAt))
    .limit(200);
  const replyMap = await getRepliesFor(rows.map((l) => l.id));
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
    replies: replyMap.get(l.id) ?? [],
  }));
}

/** A buyer-facing message thread (one row per lead the buyer opened). */
export interface MessageThread {
  id: string;
  type: string;
  status: string;
  message: string;
  createdAt: string;
  /** Links the conversation back to the car it's about. */
  listingId?: string;
  listingSlug?: string;
  listingTitle?: string;
  dealerName?: string;
  replies: LeadReplyView[];
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
        replies: [],
      },
      {
        id: "MSG-2",
        type: "test_drive",
        status: "contacted",
        message: "Requested a test drive for Saturday afternoon.",
        createdAt: new Date(now - 26 * 3600_000).toISOString(),
        listingTitle: "2021 Mercedes-Benz C 300",
        dealerName: "Deals on Wheels",
        replies: [],
      },
      {
        id: "MSG-3",
        type: "contact_unlock",
        status: "closed",
        message: "Unlocked seller contact details.",
        createdAt: new Date(now - 5 * 24 * 3600_000).toISOString(),
        listingTitle: "2020 Toyota Land Cruiser GXR",
        dealerName: "Gargash Motors",
        replies: [],
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
        listingId: leads.listingId,
        listingSlug: listings.slug,
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
    const replyMap = await getRepliesFor(rows.map((r) => r.id));
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      status: r.status,
      message: r.message ?? "",
      createdAt: r.createdAt.toISOString(),
      listingId: r.listingId ?? undefined,
      listingSlug: r.listingSlug ?? undefined,
      listingTitle: r.make ? `${r.year} ${r.make} ${r.model}` : undefined,
      dealerName: r.dealerName ?? undefined,
      replies: replyMap.get(r.id) ?? [],
    }));
  } catch {
    return [];
  }
}

/**
 * EVERY lead on the platform, for the admin console only.
 *
 * Exists so that "give me all leads" has to be asked for by name. The previous
 * behaviour — getLeadsForDealer() with no arguments quietly returning all of
 * them — meant three ordinary dashboard pages were leaking every dealer's
 * buyer contact details to every other dealer.
 */
export async function getAllLeadsForAdmin(): Promise<LeadView[]> {
  if (!(await isAdminAllowed())) return [];
  if (!isDbEnabled()) return getLeadsForDealer(undefined, undefined);
  const rows = await db
    .select()
    .from(leads)
    .orderBy(desc(leads.createdAt))
    .limit(200);
  const replyMap = await getRepliesFor(rows.map((r) => r.id));
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
    replies: replyMap.get(l.id) ?? [],
  }));
}

/**
 * Writes the buyer's opening enquiry as the first message of the thread, so a
 * conversation never starts empty and the seller sees what was actually asked.
 * Inserted directly (rather than via sendMessage) because createLead runs for
 * guests too, where there is no session to resolve a participant from.
 */
async function seedFirstMessage(
  conversationId: string,
  buyerUserId: string,
  body: string,
): Promise<void> {
  await db.insert(chatMessages).values({
    conversationId,
    senderUserId: buyerUserId,
    senderRole: "buyer",
    body,
    visibility: "all_parties",
  });
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date(), lastMessagePreview: body.slice(0, 200) })
    .where(eq(conversations.id, conversationId));
}
