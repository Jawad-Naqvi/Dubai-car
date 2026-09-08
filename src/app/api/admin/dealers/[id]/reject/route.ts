import { NextResponse } from "next/server";
import { rejectDealer } from "@/lib/data/admin";
import { isAdminAllowed, getOrSyncUser } from "@/lib/data/users";
import { recordAudit } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAllowed())) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!reason) {
    return NextResponse.json({ error: "A rejection reason is required" }, { status: 400 });
  }
  const ok = await rejectDealer(id, reason);
  if (!ok) return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
  const actor = await getOrSyncUser().catch(() => null);
  await recordAudit({
    action: "dealer.rejected",
    actorId: actor?.id,
    entityType: "dealer",
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
