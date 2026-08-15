import "server-only";
import { getLeadsForDealer, getMessagesForUser } from "./leads";
import { getQuotesForBuyer, getQuotesForDealer } from "./quotes";
import { getListingsByIds } from "./listings";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_LABEL_SELLER } from "./quotes";

/**
 * Unified conversation layer.
 *
 * The marketplace generates threads from two different places — enquiries on a
 * listing (B2C) and quotation negotiations (B2B). Buyers and dealers shouldn't
 * have to hunt through two inboxes to find "that conversation about the Patrol",
 * so both are normalised into one Conversation shape and merged into a single
 * chat history, newest activity first.
 */

export type ConversationKind = "enquiry" | "quote";

export interface ChatMessage {
  id: string;
  senderRole: "buyer" | "dealer";
  body: string;
  createdAt: string;
  /** Synthesised from the record itself (initial enquiry, quote pricing). */
  system?: boolean;
}

export interface Conversation {
  /** Namespaced so ids never collide across sources: "enquiry:<id>". */
  id: string;
  kind: ConversationKind;
  /** Underlying lead/quote id — what the send APIs take. */
  refId: string;
  /** Human reference for quotes (QT-1001). */
  reference?: string;
  /** The other party, from the caller's point of view. */
  counterpartName: string;
  subject: string;
  listingId?: string;
  listingSlug?: string;
  status: string;
  statusLabel: string;
  quantity?: number;
  messages: ChatMessage[];
  lastMessage: string;
  lastAt: string;
  /** True when the other side spoke last — drives the "needs reply" dot. */
  awaitingMe: boolean;
}

const ENQUIRY_STATUS_LABEL: Record<string, string> = {
  new: "New",
  contacted: "In progress",
  quoted: "Quoted",
  closed: "Closed",
};

const LEAD_TYPE_LABEL: Record<string, string> = {
  inquiry: "Enquiry",
  contact_unlock: "Contact request",
  test_drive: "Test drive",
  export_inquiry: "Export enquiry",
  finance_preapproval: "Finance request",
};

function aed(n?: number | null): string {
  return n || n === 0 ? `AED ${Number(n).toLocaleString("en-US")}` : "—";
}

/** Newest-activity-first, with the "needs my reply" ones surfacing naturally. */
function sortConversations(list: Conversation[]): Conversation[] {
  return list.sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
  );
}

function finalise(
  base: Omit<Conversation, "lastMessage" | "lastAt" | "awaitingMe">,
  audience: "buyer" | "seller",
): Conversation {
  const messages = [...base.messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const last = messages[messages.length - 1];
  const myRole = audience === "buyer" ? "buyer" : "dealer";
  return {
    ...base,
    messages,
    lastMessage: last?.body ?? "",
    lastAt: last?.createdAt ?? new Date().toISOString(),
    awaitingMe: Boolean(last && last.senderRole !== myRole),
  };
}

/**
 * Every conversation the caller is part of, from both thread sources.
 * `audience` decides whose side of each thread the caller is on.
 */
export async function getConversationsFor(
  userId: string,
  audience: "buyer" | "seller",
  dealerId?: string,
): Promise<Conversation[]> {
  const [leadThreads, quoteThreads] = await Promise.all([
    audience === "seller"
      ? getLeadsForDealer(dealerId).catch(() => [])
      : getMessagesForUser(userId).catch(() => []),
    audience === "seller"
      ? getQuotesForDealer(dealerId, userId).catch(() => [])
      : getQuotesForBuyer(userId).catch(() => []),
  ]);

  /* ---- Enquiry threads ---- */
  // Seller-side leads carry only a listingId, so resolve titles in one go.
  const needTitles = Array.from(
    new Set(
      leadThreads
        .map((l) => ("listingId" in l ? l.listingId : undefined))
        .filter((v): v is string => Boolean(v)),
    ),
  );
  const titleMap = new Map<string, { title: string; slug: string }>();
  if (audience === "seller" && needTitles.length) {
    const listings = await getListingsByIds(needTitles).catch(() => []);
    for (const l of listings) {
      titleMap.set(l.id, {
        title: `${l.year} ${l.make} ${l.model}`,
        slug: l.slug,
      });
    }
  }

  const enquiries: Conversation[] = leadThreads.map((l) => {
    // Buyer view (MessageThread) already has the title; seller view resolves it.
    const seller = audience === "seller";
    const listingId = l.listingId;
    const resolved = listingId ? titleMap.get(listingId) : undefined;
    const subject = seller
      ? (resolved?.title ?? "Enquiry")
      : ("listingTitle" in l && l.listingTitle) || "Enquiry";
    const counterpart = seller
      ? ("buyerName" in l && l.buyerName) || "Buyer"
      : ("dealerName" in l && l.dealerName) || "Seller";

    // The lead's own message is the opening line of the conversation.
    const opening: ChatMessage[] = l.message
      ? [
          {
            id: `${l.id}-opening`,
            senderRole: "buyer",
            body: l.message,
            createdAt: l.createdAt,
            system: true,
          },
        ]
      : [];

    return finalise(
      {
        id: `enquiry:${l.id}`,
        kind: "enquiry",
        refId: l.id,
        counterpartName: counterpart,
        subject,
        listingId,
        listingSlug: resolved?.slug,
        status: l.status,
        statusLabel:
          ENQUIRY_STATUS_LABEL[l.status] ??
          LEAD_TYPE_LABEL[l.type] ??
          l.status,
        messages: [
          ...opening,
          ...l.replies.map((r, i) => ({
            id: `${l.id}-r${i}`,
            senderRole: r.senderRole,
            body: r.body,
            createdAt: r.createdAt,
          })),
        ],
      },
      audience,
    );
  });

  /* ---- Quote threads ---- */
  const quotes: Conversation[] = quoteThreads.map((q) => {
    const messages: ChatMessage[] = [];

    // What the buyer asked for opens the thread.
    messages.push({
      id: `${q.id}-request`,
      senderRole: "buyer",
      body:
        `Requested a quote for ${q.quantity} × ${q.listingTitle ?? "vehicles"}.` +
        (q.requirements ? `\n\n${q.requirements}` : ""),
      createdAt: q.createdAt,
      system: true,
    });

    // The seller's pricing reads as their reply in the conversation.
    if (q.respondedAt && q.quotedUnitPriceAED) {
      messages.push({
        id: `${q.id}-response`,
        senderRole: "dealer",
        body:
          `Quoted ${aed(q.quotedUnitPriceAED)} per unit — ` +
          `${aed(q.quotedTotalAED)} total for ${q.quotedQuantity ?? q.quantity} units.` +
          (q.quotedNotes ? `\n\n${q.quotedNotes}` : ""),
        createdAt: q.respondedAt,
        system: true,
      });
    }

    messages.push(
      ...q.messages.map((m, i) => ({
        id: `${q.id}-m${i}`,
        senderRole: m.senderRole,
        body: m.body,
        createdAt: m.createdAt,
      })),
    );

    return finalise(
      {
        id: `quote:${q.id}`,
        kind: "quote",
        refId: q.id,
        reference: q.reference,
        counterpartName:
          audience === "seller"
            ? q.buyerCompany || q.buyerName || "Buyer"
            : q.dealerName,
        subject: q.listingTitle ?? "Bulk vehicle enquiry",
        listingId: q.listingId,
        status: q.status,
        statusLabel:
          audience === "seller"
            ? QUOTE_STATUS_LABEL_SELLER[q.status]
            : QUOTE_STATUS_LABEL[q.status],
        quantity: q.quotedQuantity ?? q.quantity,
        messages,
      },
      audience,
    );
  });

  return sortConversations([...enquiries, ...quotes]);
}
