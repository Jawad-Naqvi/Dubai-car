/**
 * Marketplace notification events.
 *
 * This file is the contract between "something happened" and "somebody gets
 * told". Features raise an event; they never talk to email/WhatsApp directly.
 * Adding a channel (SMS, push, in-app toast) means editing the dispatcher —
 * not every feature that notifies.
 *
 *      raise(event)  →  notification service  →  ┌ email
 *                                                ├ whatsapp
 *                                                └ in-app log
 */

export type NotificationEventKey =
  /* --- Enquiries (B2C) --- */
  | "lead.created"
  | "lead.replied"
  /* --- Quotations (B2B) --- */
  | "quote.requested"
  | "quote.responded"
  | "quote.accepted"
  | "quote.declined"
  | "quote.message"
  /* --- Orders (both journeys converge here) --- */
  | "order.created"
  | "order.status_changed"
  /* --- Freight (the shipping service) --- */
  | "freight.quote_received"
  | "freight.awarded"
  | "freight.milestone"
  | "freight.request_expiring"
  /* --- Account & partner lifecycle --- */
  | "org.verified"
  | "org.rejected"
  | "invitation.sent"
  /* --- Messaging --- */
  | "chat.message";

/**
 * Who a rendered notification is aimed at.
 *
 * "forwarder" exists because freight introduced a third party: a shipment
 * update goes to the buyer, the seller AND the freight partner, and forcing
 * the forwarder to masquerade as a "seller" would send them the wrong copy.
 */
export type Audience = "buyer" | "seller" | "forwarder";

export interface Recipient {
  /** Internal users.id — when present, an in-app notification row is written. */
  userId?: string;
  email?: string;
  /** E.164-ish phone for WhatsApp. */
  whatsapp?: string;
  name?: string;
}

/** Fully-rendered message for one audience, before channel formatting. */
export interface RenderedNotification {
  title: string;
  /** Long form — used for email body and the in-app record. */
  body: string;
  /** Short form — used for WhatsApp. Falls back to `body` when absent. */
  short?: string;
  /** Deep link into the app (relative), e.g. "/dashboard/quotes/QT-1042". */
  href?: string;
}

export interface NotificationEvent {
  key: NotificationEventKey;
  /** Recipient + rendered content per audience. Omit an audience to skip it. */
  to: Partial<Record<Audience, Recipient>>;
  render: Partial<Record<Audience, RenderedNotification>>;
  /** Buyer's email, so dealer emails can be replied to directly. */
  replyTo?: string;
}
