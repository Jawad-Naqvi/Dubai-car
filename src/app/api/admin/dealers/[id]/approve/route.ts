import { NextResponse } from "next/server";
import { approveDealer } from "@/lib/data/admin";
import { isAdminAllowed, getOrSyncUser } from "@/lib/data/users";
import { recordAudit } from "@/lib/audit";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAllowed())) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { id } = await params;
  const ok = await approveDealer(id);
  if (!ok) return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
  const actor = await getOrSyncUser().catch(() => null);
  await recordAudit({
    action: "dealer.approved",
    actorId: actor?.id,
    entityType: "dealer",
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
