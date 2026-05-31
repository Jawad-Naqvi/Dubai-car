import "server-only";

/**
 * Notification adapter. With a RESEND_API_KEY it sends a real transactional
 * email; otherwise (demo) it logs to the server console so the "notify the
 * dealer on a new lead" step is observable without an email provider.
 */
export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendLeadNotification(opts: {
  to?: string;
  subject: string;
  body: string;
}): Promise<void> {
  if (!isEmailEnabled()) {
    console.log(
      `📧 [demo email] → ${opts.to ?? "dealer"} | ${opts.subject}\n${opts.body}`,
    );
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DXB Motors <leads@dxbmotors.ae>",
        to: opts.to,
        subject: opts.subject,
        text: opts.body,
      }),
    });
    if (!res.ok) console.error("Resend error:", await res.text());
  } catch (e) {
    console.error("Email send failed:", e);
  }
}
