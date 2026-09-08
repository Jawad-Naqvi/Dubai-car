import { NextResponse } from "next/server";
import { log } from "@/lib/log";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Collector for browser-side crashes reported by global-error.tsx.
 *
 * Public by necessity (a crashed page may have no session), so it is rate
 * limited and the payload is capped — otherwise it is a free log-flooding
 * endpoint. It only ever writes to the log; it touches no data.
 */
export async function POST(req: Request) {
  const limit = rateLimit(`client-error:${clientIp(req)}`, 20, 60_000);
  if (!limit.ok) return new NextResponse(null, { status: 429 });

  try {
    const raw = await req.text();
    if (raw.length > 8_000) {
      return new NextResponse(null, { status: 413 });
    }
    const data = JSON.parse(raw) as Record<string, unknown>;
    log.error("client.crash", {
      message: String(data.message ?? "").slice(0, 500),
      digest: String(data.digest ?? "").slice(0, 64),
      url: String(data.url ?? "").slice(0, 300),
      stack: String(data.stack ?? "").slice(0, 3000),
      ua: req.headers.get("user-agent")?.slice(0, 200),
    });
  } catch {
    // A malformed crash report is not itself worth an error.
  }

  // 204: the browser is already in a failure state; give it nothing to parse.
  return new NextResponse(null, { status: 204 });
}
