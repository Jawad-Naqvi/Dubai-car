import { NextResponse } from "next/server";
import { runSavedSearchAlerts } from "@/lib/data/saved-searches";
import { cronAuthorized } from "@/lib/cron-auth";
import { log } from "@/lib/log";

export const runtime = "nodejs";
// Never cache — this mutates (sends emails, advances high-water marks).
export const dynamic = "force-dynamic";

/**
 * Saved-search alert delivery. Trigger on a schedule (Vercel Cron, GitHub
 * Actions, cron-job.org, …). Protect with CRON_SECRET:
 *   GET /api/cron/alerts   (header:  Authorization: Bearer $CRON_SECRET)
 *   GET /api/cron/alerts?secret=$CRON_SECRET
 * If CRON_SECRET is unset the endpoint is refused in production, and open
 * only in local development.
 */
async function handle(req: Request) {
  // Fails CLOSED in production. The previous `if (secret) { verify }` meant a
  // missing CRON_SECRET left this open to the internet — and it sends email
  // and advances high-water marks, so an open call silently suppresses real
  // alerts for every user.
  if (!cronAuthorized(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const result = await runSavedSearchAlerts();
  log.info("cron.alerts_completed", { ...result });
  return NextResponse.json({ ok: true, ...result });
}

export const GET = handle;
export const POST = handle;
