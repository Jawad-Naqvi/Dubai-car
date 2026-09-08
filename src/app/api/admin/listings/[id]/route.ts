import { NextResponse } from "next/server";
import { moderateListing } from "@/lib/data/admin";
import { isAdminAllowed, getOrSyncUser } from "@/lib/data/users";
import { recordAudit } from "@/lib/audit";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAllowed())) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (body?.action !== "approve" && body?.action !== "reject") {
    return NextResponse.json({ error: "action must be approve|reject" }, { status: 400 });
  }
  await moderateListing(id, body.action);
  const actor = await getOrSyncUser().catch(() => null);
  await recordAudit({
    action: "listing.moderated",
    actorId: actor?.id,
    entityType: "listing",
    entityId: id,
    metadata: { decision: body.action },
  });
  return NextResponse.json({ ok: true });
}
