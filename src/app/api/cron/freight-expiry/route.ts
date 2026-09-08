import { NextResponse } from "next/server";
import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { freightQuotes, freightRequests } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { cronAuthorized } from "@/lib/cron-auth";
import { recordAudit } from "@/lib/audit";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Expires stale freight quotes and requests.
 *
 * Both tables carried expiry columns that nothing ever read:
 * `freightQuotes.validUntil` was checked only at the moment of award, and
 * `freightRequests.expiresAt` was written on creation and never looked at
 * again — so a request stayed "open" forever and forwarders kept seeing dead
 * work on their bid board.
 *
 * A quote's validity is a commercial promise. Once it lapses the forwarder is
 * no longer bound by the price, and continuing to show it to a buyer as
 * bookable is misleading.
 */
async function handle(req: Request) {
  if (!cronAuthorized(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (!isDbEnabled()) {
    return NextResponse.json({ ok: true, skipped: "no database" });
  }

  const now = new Date();

  // Only bids still awaiting a decision expire. An accepted quote stays
  // accepted — the shipment it created outlives its own validity date.
  const expiredQuotes = await db
    .update(freightQuotes)
    .set({ status: "expired" })
    .where(
      and(
        sql`${freightQuotes.status} in ('invited','submitted')`,
        lt(freightQuotes.validUntil, now),
      ),
    )
    .returning({ id: freightQuotes.id });

  const expiredRequests = await db
    .update(freightRequests)
    .set({ status: "expired", updatedAt: now })
    .where(
      and(eq(freightRequests.status, "open"), lt(freightRequests.expiresAt, now)),
    )
    .returning({ id: freightRequests.id });

  const result = {
    quotesExpired: expiredQuotes.length,
    requestsExpired: expiredRequests.length,
  };

  if (result.quotesExpired || result.requestsExpired) {
    await recordAudit({
      action: "cron.freight_expiry",
      entityType: "freight",
      metadata: result,
    });
  }
  log.info("cron.freight_expiry_completed", result);

  return NextResponse.json({ ok: true, ...result });
}

export const GET = handle;
export const POST = handle;
