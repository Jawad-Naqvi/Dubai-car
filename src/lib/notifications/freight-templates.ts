import { brand } from "@/lib/brand";
import type { NotificationEvent, Recipient } from "./events";

/**
 * Notification copy for freight, partner verification and messaging.
 *
 * These flows were entirely silent: a buyer got no email when a shipping quote
 * arrived, a forwarder learned nothing when they won a job, an applicant was
 * never told they had been verified or rejected, and an admin had to copy an
 * invitation link out of a raw API response by hand.
 */

function money(minor?: number | null, currency = "AED"): string {
  if (minor === null || minor === undefined) return "—";
  return `${currency} ${(minor / 100).toLocaleString("en-US")}`;
}

/* ------------------------------------------------------------------ */
/* Freight                                                             */
/* ------------------------------------------------------------------ */

export function freightQuoteReceivedEvent(c: {
  reference: string;
  forwarderName: string;
  totalMinor: number | null;
  currency: string;
  transitDays: number | null;
  lane: string;
  buyer: Recipient;
}): NotificationEvent {
  const price = money(c.totalMinor, c.currency);
  const transit = c.transitDays ? ` · about ${c.transitDays} days` : "";
  return {
    key: "freight.quote_received",
    to: { buyer: c.buyer },
    render: {
      buyer: {
        title: `Shipping quote from ${c.forwarderName} — ${price}`,
        body: `${c.forwarderName} quoted ${price}${transit} to ship your car (${c.lane}).\n\nCompare it against the other quotes on your shipping desk and book when you are ready. Quotes are only held until their validity date.`,
        short: `${c.forwarderName}: ${price}${transit} for ${c.reference}`,
        href: "/dashboard/shipping",
      },
    },
  };
}

export function freightAwardedEvent(c: {
  reference: string;
  forwarderName: string;
  lane: string;
  buyer: Recipient;
  forwarder: Recipient;
}): NotificationEvent {
  return {
    key: "freight.awarded",
    to: { buyer: c.buyer, forwarder: c.forwarder },
    render: {
      buyer: {
        title: `Shipping booked with ${c.forwarderName}`,
        body: `Your shipment ${c.reference} is booked (${c.lane}).\n\nYou can follow every step — collection, export clearance, loading, sailing and delivery — from your shipments page. ${c.forwarderName} and your seller are in the same conversation, so you never need to chase anyone by email.`,
        short: `Shipment ${c.reference} booked with ${c.forwarderName}`,
        href: "/dashboard/shipments",
      },
      forwarder: {
        title: `You won shipment ${c.reference}`,
        body: `Your quote was accepted for ${c.lane}.\n\nThe buyer and seller can now see your updates. Post each milestone as it happens — collection, export certificate, customs, loading, sailing — so nobody has to ask where the car is.`,
        short: `Won ${c.reference} (${c.lane})`,
        href: "/dashboard/freight",
      },
    },
  };
}

export function freightMilestoneEvent(c: {
  reference: string;
  milestoneLabel: string;
  note?: string | null;
  buyer: Recipient;
  seller?: Recipient;
}): NotificationEvent {
  const body = `${c.milestoneLabel} — shipment ${c.reference}.${
    c.note ? `\n\n${c.note}` : ""
  }\n\nOpen the shipment to see the full timeline and documents.`;
  return {
    key: "freight.milestone",
    to: { buyer: c.buyer, ...(c.seller ? { seller: c.seller } : {}) },
    render: {
      buyer: {
        title: `${c.milestoneLabel} — ${c.reference}`,
        body,
        short: `${c.reference}: ${c.milestoneLabel}`,
        href: "/dashboard/shipments",
      },
      ...(c.seller
        ? {
            seller: {
              title: `${c.milestoneLabel} — ${c.reference}`,
              body,
              short: `${c.reference}: ${c.milestoneLabel}`,
              href: "/dashboard/shipments",
            },
          }
        : {}),
    },
  };
}

/* ------------------------------------------------------------------ */
/* Partner / organization verification                                 */
/* ------------------------------------------------------------------ */

export function orgVerifiedEvent(c: {
  orgName: string;
  orgType: string;
  recipient: Recipient;
}): NotificationEvent {
  const isForwarder = c.orgType === "forwarder";
  const audience = isForwarder ? "forwarder" : "seller";
  const rendered = {
    title: `${c.orgName} is verified`,
    body: isForwarder
      ? `Your freight partner account is verified.\n\nYou will now receive shipping requests on the lanes you registered. Add more lanes to see more work.`
      : `Your seller account is verified.\n\nYour listings now publish immediately instead of waiting in review, and buyers can see your verified badge.`,
    short: `${c.orgName} verified on ${brand.name}`,
    href: isForwarder ? "/dashboard/freight" : "/dashboard",
  };
  return {
    key: "org.verified",
    to: { [audience]: c.recipient },
    render: { [audience]: rendered },
  };
}

export function orgRejectedEvent(c: {
  orgName: string;
  orgType: string;
  reason: string;
  recipient: Recipient;
}): NotificationEvent {
  const audience = c.orgType === "forwarder" ? "forwarder" : "seller";
  const rendered = {
    title: `${c.orgName}: your documents need an update`,
    body: `We reviewed ${c.orgName} and need something changed before we can verify it.\n\n${c.reason}\n\nUpdate the documents and we will re-review — usually within 1–2 business days.`,
    short: `${c.orgName}: documents need an update`,
    href: "/onboarding/verify",
  };
  return {
    key: "org.rejected",
    to: { [audience]: c.recipient },
    render: { [audience]: rendered },
  };
}

export function invitationSentEvent(c: {
  orgType: string;
  orgName?: string | null;
  joinUrl: string;
  recipient: Recipient;
}): NotificationEvent {
  const what =
    c.orgType === "forwarder"
      ? "join our freight partner network"
      : c.orgType === "platform"
        ? "join the admin team"
        : "sell on the platform";
  const audience = c.orgType === "forwarder" ? "forwarder" : "seller";
  const rendered = {
    title: `You are invited to ${what}`,
    body: `${brand.name} has invited ${
      c.orgName ? `${c.orgName} ` : "you "
    }to ${what}.\n\nUse this link to set up your account:\n${c.joinUrl}\n\nThe link is single-use and expires. Do not forward it — whoever opens it gets the account.`,
    short: `Invitation to ${what}: ${c.joinUrl}`,
  };
  return {
    key: "invitation.sent",
    to: { [audience]: c.recipient },
    render: { [audience]: rendered },
  };
}

/* ------------------------------------------------------------------ */
/* Messaging                                                           */
/* ------------------------------------------------------------------ */

export function chatMessageEvent(c: {
  fromName: string;
  subject: string;
  preview: string;
  conversationId: string;
  audience: "buyer" | "seller" | "forwarder";
  recipient: Recipient;
}): NotificationEvent {
  const rendered = {
    title: `New message from ${c.fromName}`,
    body: `${c.fromName} sent you a message about ${c.subject}:\n\n"${c.preview}"\n\nReply in your inbox — every conversation you have on the platform lives in one place.`,
    short: `${c.fromName}: ${c.preview.slice(0, 120)}`,
    href: `/dashboard/messages?c=${c.conversationId}`,
  };
  return {
    key: "chat.message",
    to: { [c.audience]: c.recipient },
    render: { [c.audience]: rendered },
  };
}
