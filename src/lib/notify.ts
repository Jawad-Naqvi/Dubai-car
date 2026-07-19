import "server-only";

/**
 * Notification adapter. With a RESEND_API_KEY it sends a real transactional
 * email; otherwise (demo) it logs to the server console so the "notify the
 * dealer on a new lead" step is observable without an email provider.
 */
export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Send a transactional email via Resend. No-ops with a console log when
 * RESEND_API_KEY is unset (so flows stay observable in dev) or there's no
 * recipient. Returns true if an email was actually dispatched.
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
    const from = process.env.LEADS_FROM_EMAIL || "DXB Motors <leads@dxbmotors.ae>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: opts.subject,
        text: opts.body,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error("Resend error:", await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("Email send failed:", e);
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
