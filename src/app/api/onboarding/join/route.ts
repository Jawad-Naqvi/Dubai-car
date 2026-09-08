import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { acceptInvitation } from "@/lib/data/invitations";
import { getOrSyncUser } from "@/lib/data/users";

/**
 * Redeems an invitation for the signed-in user.
 *
 * The role is read from the invitation row server-side. The only thing the
 * client contributes is a display name, which is why a forged body cannot
 * escalate anyone into a forwarder or admin account.
 */
export async function POST(req: Request) {
  const user = await getOrSyncUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.token !== "string") {
    return NextResponse.json({ error: "Missing invitation token." }, { status: 400 });
  }

  const result = await acceptInvitation(body.token, user);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Let a partner correct the company name at the moment they accept.
  if (typeof body.orgName === "string" && body.orgName.trim()) {
    await db
      .update(organizations)
      .set({ name: body.orgName.trim().slice(0, 200), updatedAt: new Date() })
      .where(eq(organizations.id, result.orgId));
  }

  return NextResponse.json({
    ok: true,
    orgId: result.orgId,
    orgType: result.orgType,
  });
}
