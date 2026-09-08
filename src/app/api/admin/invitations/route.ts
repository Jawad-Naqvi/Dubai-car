import { NextResponse } from "next/server";
import { createInvitation, listInvitations, revokeInvitation } from "@/lib/data/invitations";
import { isAdminAllowed, getOrSyncUser } from "@/lib/data/users";
import type { OrgType } from "@/lib/data/orgs";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const ORG_TYPES: OrgType[] = ["buyer", "dealer", "forwarder", "platform"];

export async function GET() {
  if (!(await isAdminAllowed())) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  return NextResponse.json({ invitations: await listInvitations() });
}

/**
 * Issues an onboarding link. This is how freight forwarders and fellow admins
 * get accounts — the privileged role is bound to the token here, server-side,
 * and the plaintext token is returned exactly once for the admin to share.
 */
export async function POST(req: Request) {
  if (!(await isAdminAllowed())) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const admin = await getOrSyncUser().catch(() => null);

  const body = await req.json().catch(() => null);
  if (!body || !ORG_TYPES.includes(body.orgType)) {
    return NextResponse.json({ error: "Choose a partner type." }, { status: 400 });
  }

  const created = await createInvitation({
    orgType: body.orgType,
    email: typeof body.email === "string" ? body.email : undefined,
    orgName: typeof body.orgName === "string" ? body.orgName : undefined,
    countryCode: typeof body.countryCode === "string" ? body.countryCode : undefined,
    grantsAdmin: body.orgType === "platform",
    note: typeof body.note === "string" ? body.note : undefined,
    invitedByUserId: admin?.id,
    ttlDays: typeof body.ttlDays === "number" ? body.ttlDays : undefined,
  });

  if (!created) {
    return NextResponse.json({ error: "Could not create invitation." }, { status: 500 });
  }

  // Minting a link that can create a freight partner or a platform admin is
  // an escalation event. The TOKEN is never recorded — only that a link of
  // this type was issued, by whom, and for which address.
  await recordAudit({
    action: "invitation.created",
    actorId: admin?.id,
    entityType: "invitation",
    entityId: created.id,
    metadata: {
      orgType: body.orgType,
      grantsAdmin: body.orgType === "platform",
      invitedEmail: typeof body.email === "string" ? body.email : null,
    },
  });

  return NextResponse.json({
    ok: true,
    id: created.id,
    // Shown once. There is no way to retrieve it again — only its hash is kept.
    joinPath: `/join/${created.token}`,
  });
}

export async function DELETE(req: Request) {
  if (!(await isAdminAllowed())) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await revokeInvitation(id);
  const revoker = await getOrSyncUser().catch(() => null);
  await recordAudit({
    action: "invitation.revoked",
    actorId: revoker?.id,
    entityType: "invitation",
    entityId: id,
  });
  return NextResponse.json({ ok: true });
}
