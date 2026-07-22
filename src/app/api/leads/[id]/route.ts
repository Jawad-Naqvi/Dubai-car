import { NextResponse } from "next/server";
import { updateLeadStatus, getLeadOwnership } from "@/lib/data/leads";
import { getCurrentDealer, isAdminAllowed, dashboardsOpen } from "@/lib/data/users";

/** Only the owning dealer (or admin) re-tags a lead's status. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.status) {
    return NextResponse.json({ error: "status required" }, { status: 400 });
  }

  if (!(await isAdminAllowed()) && !dashboardsOpen()) {
    const ownership = await getLeadOwnership(id);
    const dealer = await getCurrentDealer();
    if (!ownership || !dealer || ownership.dealerId !== dealer.id) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
  }

  await updateLeadStatus(id, body.status);
  return NextResponse.json({ ok: true });
}
