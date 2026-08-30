import { brand } from "@/lib/brand";
import type { NotificationEvent, Recipient } from "./events";

/** AED money for notification copy (no Intl locale switching needed here). */
function aed(n?: number | null): string {
  if (!n && n !== 0) return "—";
  return `AED ${Number(n).toLocaleString("en-US")}`;
}

export interface QuoteNotificationContext {
  reference: string;
  quantity: number;
  /** e.g. "2023 Toyota Land Cruiser" or "Bulk enquiry" for dealer-level quotes. */
  subject: string;
  sellerName: string;
  buyerName?: string;
  buyerCompany?: string;
  requirements?: string;
  quotedUnitPriceAED?: number | null;
  quotedTotalAED?: number | null;
  quotedNotes?: string | null;
  validUntil?: string | null;
  buyer: Recipient;
  seller: Recipient;
  replyTo?: string;
}

const buyerQuoteHref = (ref: string) => `/dashboard/quotes?ref=${ref}`;
const sellerQuoteHref = (ref: string) => `/dashboard/quotes?ref=${ref}`;

/* ------------------------------------------------------------------ */
/* Quote lifecycle                                                     */
/* ------------------------------------------------------------------ */

export function quoteRequestedEvent(
  c: QuoteNotificationContext,
): NotificationEvent {
  const who = c.buyerCompany || c.buyerName || "A buyer";
  return {
    key: "quote.requested",
    replyTo: c.replyTo,
    to: { buyer: c.buyer, seller: c.seller },
    render: {
      buyer: {
        title: `Quote request ${c.reference} sent to ${c.sellerName}`,
        body: [
          `We've sent your request for ${c.quantity} × ${c.subject} to ${c.sellerName}.`,
          "",
          `Reference: ${c.reference}`,
          c.requirements ? `Your requirements:\n${c.requirements}` : "",
          "",
          "You'll be notified as soon as they respond with pricing.",
        ]
          .filter(Boolean)
          .join("\n"),
        short: `✅ Your quotation request ${c.reference} for ${c.quantity} × ${c.subject} has been sent to ${c.sellerName}. We'll notify you when they respond.`,
        href: buyerQuoteHref(c.reference),
      },
      seller: {
        title: `New quote request ${c.reference} — ${c.quantity} × ${c.subject}`,
        body: [
          `${who} requested a bulk quote on ${brand.name}.`,
          "",
          `Reference: ${c.reference}`,
          `Quantity:  ${c.quantity}`,
          `Vehicle:   ${c.subject}`,
          `Buyer:     ${c.buyerName ?? "—"}${c.buyerCompany ? ` (${c.buyerCompany})` : ""}`,
          c.requirements ? `\nRequirements:\n${c.requirements}` : "",
          "",
          "Respond with your pricing from your dashboard.",
        ]
          .filter(Boolean)
          .join("\n"),
        short: `📩 New quote request ${c.reference}: ${c.quantity} × ${c.subject} from ${who}. Respond in your dashboard.`,
        href: sellerQuoteHref(c.reference),
      },
    },
  };
}

export function quoteRespondedEvent(
  c: QuoteNotificationContext,
): NotificationEvent {
  const total = aed(c.quotedTotalAED);
  const unit = aed(c.quotedUnitPriceAED);
  return {
    key: "quote.responded",
    to: { buyer: c.buyer, seller: c.seller },
    render: {
      buyer: {
        title: `${c.sellerName} responded to quote ${c.reference}`,
        body: [
          `${c.sellerName} has priced your request for ${c.quantity} × ${c.subject}.`,
          "",
          `Unit price: ${unit}`,
          `Total:      ${total}`,
          c.validUntil ? `Valid until: ${c.validUntil}` : "",
          c.quotedNotes ? `\nSeller notes:\n${c.quotedNotes}` : "",
          "",
          "Accept, decline, or keep negotiating from your dashboard.",
        ]
          .filter(Boolean)
          .join("\n"),
        short: `💬 The dealer has responded to your quotation ${c.reference}: ${total} total (${unit}/unit). Review it in your dashboard.`,
        href: buyerQuoteHref(c.reference),
      },
      seller: {
        title: `Quote ${c.reference} sent to ${c.buyerName ?? "buyer"}`,
        body: `Your pricing for ${c.quantity} × ${c.subject} (${total}) has been sent. We'll notify you when the buyer responds.`,
        short: `Quote ${c.reference} sent — ${total}.`,
        href: sellerQuoteHref(c.reference),
      },
    },
  };
}

export function quoteAcceptedEvent(
  c: QuoteNotificationContext & { orderReference?: string },
): NotificationEvent {
  const total = aed(c.quotedTotalAED);
  return {
    key: "quote.accepted",
    to: { buyer: c.buyer, seller: c.seller },
    render: {
      buyer: {
        title: `Quote ${c.reference} accepted — order ${c.orderReference ?? ""}`.trim(),
        body: [
          `You accepted ${c.sellerName}'s quote for ${c.quantity} × ${c.subject} at ${total}.`,
          c.orderReference ? `\nOrder ${c.orderReference} has been created.` : "",
          "",
          `${c.sellerName} will be in touch to arrange payment and handover.`,
        ]
          .filter(Boolean)
          .join("\n"),
        short: `🎉 Your quotation ${c.reference} has been accepted and order ${c.orderReference ?? ""} created (${total}). The dealer will contact you shortly.`,
        href: "/dashboard/orders",
      },
      seller: {
        title: `${c.buyerName ?? "The buyer"} accepted quote ${c.reference}`,
        body: [
          `${c.buyerCompany || c.buyerName || "The buyer"} accepted your quote for ${c.quantity} × ${c.subject} at ${total}.`,
          c.orderReference ? `Order ${c.orderReference} is now in your pipeline.` : "",
          "",
          "Confirm the order and arrange payment/handover from your dashboard.",
        ]
          .filter(Boolean)
          .join("\n"),
        short: `🎉 Quote ${c.reference} accepted — ${total}. Order ${c.orderReference ?? ""} created.`,
        href: "/dashboard/orders",
      },
    },
  };
}

export function quoteDeclinedEvent(
  c: QuoteNotificationContext & { by: "buyer" | "seller"; reason?: string },
): NotificationEvent {
  const byBuyer = c.by === "buyer";
  return {
    key: "quote.declined",
    to: { buyer: c.buyer, seller: c.seller },
    render: {
      buyer: {
        title: byBuyer
          ? `You declined quote ${c.reference}`
          : `${c.sellerName} can't fulfil quote ${c.reference}`,
        body: byBuyer
          ? `Quote ${c.reference} for ${c.quantity} × ${c.subject} has been declined. You can request a new quote at any time.`
          : [
              `${c.sellerName} is unable to fulfil your request for ${c.quantity} × ${c.subject}.`,
              c.reason ? `\nReason: ${c.reason}` : "",
              "",
              "Try another dealer — plenty of verified yards carry similar stock.",
            ]
              .filter(Boolean)
              .join("\n"),
        short: byBuyer
          ? `Quote ${c.reference} declined.`
          : `The dealer can't fulfil quote ${c.reference}${c.reason ? `: ${c.reason}` : "."}`,
        href: byBuyer ? buyerQuoteHref(c.reference) : "/dealers",
      },
      seller: {
        title: byBuyer
          ? `${c.buyerName ?? "The buyer"} declined quote ${c.reference}`
          : `You declined quote ${c.reference}`,
        body: byBuyer
          ? `${c.buyerCompany || c.buyerName || "The buyer"} declined your pricing for ${c.quantity} × ${c.subject}.`
          : `Quote ${c.reference} has been marked as declined.`,
        short: byBuyer
          ? `Quote ${c.reference} was declined by the buyer.`
          : `Quote ${c.reference} declined.`,
        href: sellerQuoteHref(c.reference),
      },
    },
  };
}

export function quoteMessageEvent(
  c: QuoteNotificationContext & { from: "buyer" | "seller"; message: string },
): NotificationEvent {
  const fromBuyer = c.from === "buyer";
  const author = fromBuyer
    ? c.buyerCompany || c.buyerName || "The buyer"
    : c.sellerName;
  const rendered = {
    title: `New message on quote ${c.reference}`,
    body: `${author} wrote:\n\n"${c.message}"\n\nReply from your dashboard to keep the thread in one place.`,
    short: `💬 New message on quote ${c.reference} from ${author}.`,
    href: buyerQuoteHref(c.reference),
  };
  // Only the *other* party gets pinged.
  return {
    key: "quote.message",
    to: fromBuyer ? { seller: c.seller } : { buyer: c.buyer },
    render: fromBuyer ? { seller: rendered } : { buyer: rendered },
  };
}

/* ------------------------------------------------------------------ */
/* Order lifecycle                                                     */
/* ------------------------------------------------------------------ */

export interface OrderNotificationContext {
  reference: string;
  subject: string;
  quantity: number;
  totalAED: number;
  sellerName: string;
  buyerName?: string;
  buyer: Recipient;
  seller: Recipient;
  replyTo?: string;
}

const ORDER_STATUS_COPY: Record<string, string> = {
  pending: "is awaiting seller confirmation",
  confirmed: "has been confirmed by the seller",
  in_progress: "is being prepared for handover",
  completed: "has been completed",
  cancelled: "has been cancelled",
};

export function orderCreatedEvent(c: OrderNotificationContext): NotificationEvent {
  const total = aed(c.totalAED);
  return {
    key: "order.created",
    replyTo: c.replyTo,
    to: { buyer: c.buyer, seller: c.seller },
    render: {
      buyer: {
        title: `Order ${c.reference} created — ${c.subject}`,
        body: [
          `Your order for ${c.quantity} × ${c.subject} (${total}) has been placed with ${c.sellerName}.`,
          "",
          `Reference: ${c.reference}`,
          "",
          "Track its status any time from your dashboard.",
        ].join("\n"),
        short: `🧾 Order ${c.reference} placed with ${c.sellerName} — ${total}.`,
        href: "/dashboard/orders",
      },
      seller: {
        title: `New order ${c.reference} — ${c.quantity} × ${c.subject}`,
        body: [
          `${c.buyerName ?? "A buyer"} placed an order for ${c.quantity} × ${c.subject}.`,
          "",
          `Reference: ${c.reference}`,
          `Total:     ${total}`,
          "",
          "Confirm it from your dashboard to move it forward.",
        ].join("\n"),
        short: `🧾 New order ${c.reference}: ${c.quantity} × ${c.subject}, ${total}.`,
        href: "/dashboard/orders",
      },
    },
  };
}

export function orderStatusChangedEvent(
  c: OrderNotificationContext & { status: string },
): NotificationEvent {
  const phrase = ORDER_STATUS_COPY[c.status] ?? `is now ${c.status}`;
  return {
    key: "order.status_changed",
    to: { buyer: c.buyer },
    render: {
      buyer: {
        title: `Order ${c.reference} ${phrase}`,
        body: `Your order for ${c.quantity} × ${c.subject} with ${c.sellerName} ${phrase}.`,
        short: `📦 Order ${c.reference} ${phrase}.`,
        href: "/dashboard/orders",
      },
    },
  };
}
