/**
 * Shared quote/order status vocabulary — pure types + label constants, no DB
 * and no `server-only`, so CLIENT components (status badges, workspaces) can
 * import them without dragging the server-only data layer into the browser
 * bundle. `lib/data/quotes.ts` and `lib/data/orders.ts` re-export these so
 * existing server-side imports keep working unchanged.
 */

export type QuoteStatus =
  | "requested"
  | "under_review"
  | "responded"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "expired";

/** Buyer-facing labels — plain language, no B2B jargon. */
export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  requested: "Awaiting response",
  under_review: "Under review",
  responded: "Quote received",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
  expired: "Expired",
};

/** Dealer-facing labels for the same states. */
export const QUOTE_STATUS_LABEL_SELLER: Record<QuoteStatus, string> = {
  requested: "New request",
  under_review: "Under review",
  responded: "Quote sent",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn by buyer",
  expired: "Expired",
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

/** One vocabulary for both journeys — a buyer never sees "B2B" or "B2C". */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};
