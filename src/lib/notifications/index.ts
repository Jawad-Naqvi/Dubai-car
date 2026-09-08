import "server-only";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { sendEmail } from "@/lib/notify";
import { sendWhatsApp } from "@/lib/whatsapp";
import { log } from "@/lib/log";
import type {
  Audience,
  NotificationEvent,
  RenderedNotification,
  Recipient,
} from "./events";

export * from "./events";
export * from "./templates";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://dxbmotors.ae";

function absolute(href?: string): string | undefined {
  if (!href) return undefined;
  return href.startsWith("http") ? href : `${SITE_URL}${href}`;
}

/**
 * Deliver one audience's message across every channel we support. Channels
 * fail independently and never throw — a dead SMTP box must not roll back the
 * quote that triggered it.
 */
async function deliver(
  event: NotificationEvent,
  audience: Audience,
  to: Recipient,
  msg: RenderedNotification,
): Promise<string[]> {
  const link = absolute(msg.href);
  const emailBody = link ? `${msg.body}\n\nOpen it here: ${link}` : msg.body;
  const whatsappBody = `${msg.short ?? msg.body}${link ? `\n${link}` : ""}`;
  const delivered: string[] = [];

  const [emailed, whatsapped] = await Promise.all([
    to.email
      ? sendEmail({
          to: to.email,
          subject: msg.title,
          body: emailBody,
          replyTo: audience === "seller" ? event.replyTo : undefined,
          label: event.key,
        }).catch(() => false)
      : Promise.resolve(false),
    to.whatsapp
      ? sendWhatsApp({
          to: to.whatsapp,
          body: whatsappBody,
          label: event.key,
        }).catch(() => false)
      : Promise.resolve(false),
  ]);
  if (emailed) delivered.push("email");
  if (whatsapped) delivered.push("whatsapp");

  // In-app history — only for known users, and only in DB mode.
  if (to.userId && isDbEnabled()) {
    try {
      await db.insert(notifications).values({
        userId: to.userId,
        event: event.key,
        title: msg.title,
        body: msg.body,
        href: msg.href,
        channels: delivered,
      });
      delivered.push("inapp");
    } catch {
      /* notification history is best-effort */
    }
  }

  return delivered;
}

/**
 * Raise a marketplace event. Fans out to every channel for every audience.
 *
 * Callers should NOT await this on the request path — use `void notify(...)`
 * so a slow provider never delays the user's response.
 */
export async function notify(event: NotificationEvent): Promise<void> {
  const audiences: Audience[] = ["buyer", "seller", "forwarder"];
  await Promise.all(
    audiences.map(async (audience) => {
      const to = event.to[audience];
      const msg = event.render[audience];
      if (!to || !msg) return;
      if (!to.email && !to.whatsapp && !to.userId) return;
      try {
        await deliver(event, audience, to, msg);
      } catch (e) {
        log.error("notify.failed", { event: event.key, audience, err: e });
      }
    }),
  );
}
