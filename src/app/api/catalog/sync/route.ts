import { NextResponse } from "next/server";
import { runCatalogSync, recentSyncRuns } from "@/lib/catalog/sync";
import { isAdminAllowed } from "@/lib/data/users";

export const maxDuration = 300;

/**
 * POST /api/catalog/sync — run a catalog sync.
 * Authorized either by the CRON_SECRET bearer token (Vercel Cron / external
 * scheduler) or by an admin session (manual trigger from /admin/catalog).
 */
export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const isCron = Boolean(cronSecret) && auth === `Bearer ${cronSecret}`;

  if (!isCron && !(await isAdminAllowed())) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const result = await runCatalogSync(isCron ? "cron" : "manual");
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}

/**
 * GET /api/catalog/sync
 * - With the CRON_SECRET bearer header (how Vercel Cron invokes routes): runs a sync.
 * - Otherwise (admin session): returns recent sync run history.
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (cronSecret && auth === `Bearer ${cronSecret}`) {
    const result = await runCatalogSync("cron");
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  }
  if (!(await isAdminAllowed())) return new NextResponse("Forbidden", { status: 403 });
  const runs = await recentSyncRuns();
  return NextResponse.json({ runs });
}
