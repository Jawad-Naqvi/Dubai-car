import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Email adapter (SMTP via nodemailer).
 *
 * Configure with standard SMTP env vars — works with any provider (Gmail /
 * Google Workspace, Microsoft 365, Zoho, Amazon SES SMTP, Mailgun SMTP, a VPS
 * postfix, etc.):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *   SMTP_SECURE   ("true" for port 465 implicit TLS; else STARTTLS)
 *   SMTP_FROM     default From header, e.g. "DXB Motors <leads@dxbmotors.ae>"
 *
 * When SMTP isn't configured it logs to the server console so lead/alert flows
 * stay observable in dev without a mail server.
 */
export function isEmailEnabled(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
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
