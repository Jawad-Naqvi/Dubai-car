import "server-only";

/**
 * Tiny in-memory sliding-window rate limiter. Good enough to blunt abusive
 * bursts (spam listings, upload floods) on a single instance; for multi-region
 * production, back this with Redis/Upstash. State is per-process and resets on
 * restart — intentionally lightweight, not a security boundary on its own.
 */
const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    const retryAfterSec = Math.ceil((hits[0] + windowMs - now) / 1000);
    buckets.set(key, hits);
    return { ok: false, remaining: 0, retryAfterSec };
  }

  hits.push(now);
  buckets.set(key, hits);

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => t <= cutoff)) buckets.delete(k);
    }
  }

  return { ok: true, remaining: limit - hits.length, retryAfterSec: 0 };
}

/** Best-effort client IP from proxy headers (Vercel/Cloudflare/nginx). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
