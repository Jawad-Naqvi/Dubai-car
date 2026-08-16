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
  | "order.status_changed";

/** Who a rendered notification is aimed at. */
export type Audience = "buyer" | "seller";

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
