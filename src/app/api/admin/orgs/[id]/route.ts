import { NextResponse } from "next/server";
import { setOrgStatus, type OrgStatus } from "@/lib/data/orgs";
import { isAdminAllowed, getOrSyncUser } from "@/lib/data/users";
import { recordAudit } from "@/lib/audit";

const STATUSES: OrgStatus[] = [
  "incomplete",
  "pending",
  "active",
  "rejected",
  "suspended",
];

/** Admin approves, rejects or suspends an organization. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAllowed())) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || !STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  if (body.status === "rejected" && !body.rejectionReason) {
    return NextResponse.json(
      { error: "Give a reason so they know what to fix." },
      { status: 400 },
    );
  }

  const reviewer = await getOrSyncUser().catch(() => null);
  await setOrgStatus(id, body.status, {
    reviewerUserId: reviewer?.id,
    rejectionReason:
      typeof body.rejectionReason === "string" ? body.rejectionReason : undefined,
  });

  // Verifying an organization is what lets a dealer publish and a freight
  // partner receive customer cargo details — it needs a permanent record.
  await recordAudit({
    action: "org.status_changed",
    actorId: reviewer?.id,
    entityType: "organization",
    entityId: id,
    metadata: { status: body.status, hasReason: !!body.rejectionReason },
  });

  return NextResponse.json({ ok: true });
}
