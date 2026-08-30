import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Email adapter — supports two providers, chosen by which env vars are set:
 *
 *  1. Resend (HTTP API) — set RESEND_API_KEY. Simplest once you own a domain
 *     and verify it in Resend. `from` must be on the verified domain.
 *  2. SMTP (nodemailer) — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
 *     SMTP_SECURE. Works with any provider (Google Workspace, M365, Zoho,
 *     Amazon SES SMTP, Mailgun, a VPS postfix, …).
 *
 * Shared:
 *   SMTP_FROM / LEADS_FROM_EMAIL   default From header, e.g. "DXB Motors <leads@dxbmotors.ae>"
 *
 * Resend is preferred when both are set. When neither is configured it logs to
 * the server console so lead/alert flows stay observable in dev.
 */
/**
 * True only for a real value — treats blanks and obvious placeholders
 * (e.g. "re_xxxxx", "your-key", "changeme") as unset, so a stubbed .env
 * doesn't make a provider look configured and then fail at send time.
 */
export function envSet(v?: string): boolean {
  return Boolean(v && v.trim() && !/x{3,}|your[-_]|changeme|placeholder/i.test(v));
}

export function isEmailEnabled(): boolean {
  return Boolean(
    envSet(process.env.RESEND_API_KEY) ||
      (envSet(process.env.SMTP_HOST) && envSet(process.env.SMTP_USER)),
  );
}

async function sendViaResend(opts: {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [opts.to],
        subject: opts.subject,
        text: opts.body,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error("Resend send failed:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("Resend send error:", e);
    return false;
  }
}

function fromAddress(): string {
  return (
    process.env.SMTP_FROM ||
    process.env.LEADS_FROM_EMAIL ||
    "DXB Motors <leads@dxbmotors.ae>"
  );
}

let cachedTransport: Transporter | null = null;
function transport(): Transporter {
  if (cachedTransport) return cachedTransport;
  const port = Number(process.env.SMTP_PORT ?? 587);
  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // Implicit TLS on 465; STARTTLS (upgraded) on 587/25.
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === "true"
      : port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return cachedTransport;
}

/**
 * Send a transactional email over SMTP. No-ops with a console log when SMTP is
 * unconfigured or there's no recipient. Returns true if an email was dispatched.
 */
export async function sendEmail(opts: {
  to?: string;
  subject: string;
  body: string;
  replyTo?: string;
  label?: string;
}): Promise<boolean> {
  const to = opts.to || process.env.LEADS_NOTIFY_EMAIL;
  if (!isEmailEnabled() || !to) {
    console.log(
      `📧 [${opts.label ?? "email"}] → ${to ?? "(no recipient configured)"} | ${opts.subject}\n${opts.body}`,
    );
    return false;
  }
  // Prefer Resend when configured, else fall back to SMTP.
  if (envSet(process.env.RESEND_API_KEY)) {
    return sendViaResend({ to, subject: opts.subject, body: opts.body, replyTo: opts.replyTo });
  }
  try {
    await transport().sendMail({
      from: fromAddress(),
      to,
      subject: opts.subject,
      text: opts.body,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    });
    return true;
  } catch (e) {
    console.error("SMTP send failed:", e);
    return false;
  }
}

/** New-lead notification to the dealer/seller. */
export async function sendLeadNotification(opts: {
  to?: string;
  subject: string;
  body: string;
  /** Buyer's email so the dealer can reply straight to them. */
  replyTo?: string;
}): Promise<void> {
  await sendEmail({ ...opts, label: "lead notification" });
}
