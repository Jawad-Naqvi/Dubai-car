import { NextResponse } from "next/server";
import { runSavedSearchAlerts } from "@/lib/data/saved-searches";

export const runtime = "nodejs";
// Never cache — this mutates (sends emails, advances high-water marks).
export const dynamic = "force-dynamic";

/**
 * Saved-search alert delivery. Trigger on a schedule (Vercel Cron, GitHub
 * Actions, cron-job.org, …). Protect with CRON_SECRET:
 *   GET /api/cron/alerts   (header:  Authorization: Bearer $CRON_SECRET)
 *   GET /api/cron/alerts?secret=$CRON_SECRET
 * If CRON_SECRET is unset, the endpoint is open (dev only).
 */
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    const qp = new URL(req.url).searchParams.get("secret");
    const ok = auth === `Bearer ${secret}` || qp === secret;
    if (!ok) return new NextResponse("Unauthorized", { status: 401 });
  }
  const result = await runSavedSearchAlerts();
  return NextResponse.json({ ok: true, ...result });
}

export const GET = handle;
export const POST = handle;
