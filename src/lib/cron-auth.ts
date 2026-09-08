import "server-only";

/**
 * One gate for every scheduled endpoint.
 *
 * The old check was `if (secret) { verify }` — meaning a missing CRON_SECRET
 * left the endpoint fully open, and it mutated state (sent alert emails,
 * advanced high-water marks). A deployment that forgot one env var silently
 * exposed a write endpoint to the internet.
 *
 * This fails CLOSED in production: no secret configured means nothing runs.
 * Local development may run jobs unauthenticated so they can be exercised by
 * hand, and says so in the log.
 */
export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") return false;
    return true; // dev convenience only
  }

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  // Vercel Cron sends the secret as a bearer token; the query form remains
  // for external schedulers that cannot set headers.
  const qp = new URL(req.url).searchParams.get("secret");
  return qp === secret;
}
