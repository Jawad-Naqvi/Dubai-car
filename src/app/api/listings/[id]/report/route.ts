import { NextResponse } from "next/server";
import { createReport } from "@/lib/data/reports";
import { getOrSyncUser } from "@/lib/data/users";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/listings/[id]/report  { reason, details?, email? }
 * Open to anyone (fraud reporting shouldn't require an account) but
 * rate-limited per IP. Attaches the reporter's user id when signed in.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const rl = rateLimit(`report:${clientIp(req)}`, 10, 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many reports, try later." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => ({}));
  if (!body?.reason) {
    return NextResponse.json({ error: "reason required" }, { status: 400 });
  }
  const user = await getOrSyncUser().catch(() => null);

  const res = await createReport({
    listingId: id,
    reason: String(body.reason),
    details: typeof body.details === "string" ? body.details : undefined,
    reporterEmail: typeof body.email === "string" ? body.email : undefined,
    reporterId: user?.id,
  });
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
