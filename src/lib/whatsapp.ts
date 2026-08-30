import "server-only";

/**
 * WhatsApp adapter — Meta WhatsApp Cloud API (graph.facebook.com).
 *
 * Configure with:
 *   WHATSAPP_PHONE_NUMBER_ID   the Cloud API phone number ID
 *   WHATSAPP_ACCESS_TOKEN      a permanent system-user access token
 *   WHATSAPP_API_VERSION       optional, defaults to v21.0
 *
 * When unconfigured it logs to the server console (so lead/notification flows
 * stay observable in dev) and returns false — exactly like the email adapter.
 * Live delivery starts the moment the two env vars are set; no code change.
 *
 * Note: outside the 24-hour customer service window, the Cloud API only allows
 * pre-approved message *templates*. Free-form text (used here) is delivered when
 * the recipient has messaged the business number within 24h; otherwise Meta
 * returns an error which we log and swallow. A template path can be added later.
 */
/** Real value only — ignores blanks/placeholders so a stubbed .env no-ops. */
function envSet(v?: string): boolean {
  return Boolean(v && v.trim() && !/x{3,}|your[-_]|changeme|placeholder/i.test(v));
}

export function isWhatsappEnabled(): boolean {
  return Boolean(
    envSet(process.env.WHATSAPP_PHONE_NUMBER_ID) &&
      envSet(process.env.WHATSAPP_ACCESS_TOKEN),
  );
}

/** Digits-only E.164-ish number (Cloud API wants no "+" or separators). */
function normalizeNumber(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

export async function sendWhatsApp(opts: {
  to?: string;
  body: string;
  label?: string;
}): Promise<boolean> {
  const to = opts.to ? normalizeNumber(opts.to) : "";
  if (!isWhatsappEnabled() || !to) {
    console.log(
      `💬 [${opts.label ?? "whatsapp"}] → ${to || "(no recipient / not configured)"} | ${opts.body}`,
    );
    return false;
  }
  const version = process.env.WHATSAPP_API_VERSION || "v21.0";
  const url = `https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: opts.body },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("WhatsApp send failed:", res.status, detail);
      return false;
    }
    return true;
  } catch (e) {
    console.error("WhatsApp send error:", e);
    return false;
  }
}
