import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { isDbEnabled } from "@/lib/db/enabled";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const startedAt = Date.now();

/**
 * Liveness + readiness for load balancers and uptime monitors.
 *
 *   200  — the process is up AND the database answers
 *   503  — the database does not answer; take this instance out of rotation
 *
 * Reveals nothing an attacker can use: no versions of dependencies, no
 * connection strings, no table counts. `commit` is the deployed SHA so an
 * on-call engineer can tell which build is serving.
 */
export async function GET() {
  const checks: Record<string, "ok" | "fail" | "skipped"> = {};
  let healthy = true;

  if (isDbEnabled()) {
    try {
      const started = performance.now();
      await db.execute(sql`select 1`);
      checks.database = "ok";
      checks.databaseLatencyMs = Math.round(performance.now() - started) as never;
    } catch {
      checks.database = "fail";
      healthy = false;
    }
  } else {
    checks.database = "skipped";
  }

  const body = {
    status: healthy ? "ok" : "degraded",
    uptimeSec: Math.round((Date.now() - startedAt) / 1000),
    commit:
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
      process.env.GIT_SHA?.slice(0, 7) ??
      "unknown",
    checks,
  };

  return NextResponse.json(body, {
    status: healthy ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
