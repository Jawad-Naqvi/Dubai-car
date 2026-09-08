import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitations, users } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { ensureOrg, type MemberRole, type OrgType } from "@/lib/data/orgs";
import type { CurrentUser } from "@/lib/data/users";
import { recordAudit } from "@/lib/audit";

/**
 * ADMIN-ISSUED ONBOARDING LINKS.
 *
 * Freight forwarders never appear on the public sign-up picker. They either
 * apply (partnerApplications) and get reviewed, or an admin sends them a link.
 * The privileged role travels INSIDE the invitation row, keyed by a token the
 * admin shares out-of-band — it is never a query parameter the visitor can
 * edit, which is what stops someone typing their way into a forwarder or
 * admin account.
 *
 * Only the SHA-256 of the token is stored. A database dump therefore cannot be
 * replayed into an account, the same reason password hashes exist.
 */

const DEFAULT_TTL_DAYS = 14;

export interface InvitePreview {
  orgType: OrgType;
  orgName: string | null;
  email: string | null;
  countryCode: string;
  grantsAdmin: boolean;
  memberRole: MemberRole;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Creates an invitation and returns the ONE-TIME plaintext token. */
export async function createInvitation(input: {
  orgType: OrgType;
  email?: string;
  orgName?: string;
  countryCode?: string;
  memberRole?: MemberRole;
  grantsAdmin?: boolean;
  orgId?: string;
  note?: string;
  invitedByUserId?: string;
  ttlDays?: number;
}): Promise<{ token: string; id: string } | null> {
  if (!isDbEnabled()) return null;

  // 32 bytes of CSPRNG entropy — not guessable, not enumerable.
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(
    Date.now() + (input.ttlDays ?? DEFAULT_TTL_DAYS) * 86_400_000,
  );

  const [row] = await db
    .insert(invitations)
    .values({
      tokenHash: hashToken(token),
      email: input.email?.toLowerCase() ?? null,
      orgType: input.orgType,
      orgId: input.orgId ?? null,
      orgName: input.orgName ?? null,
      countryCode: input.countryCode ?? "AE",
      memberRole: input.memberRole ?? "owner",
      grantsAdmin: input.grantsAdmin ?? false,
      note: input.note ?? null,
      invitedByUserId: input.invitedByUserId ?? null,
      expiresAt,
    })
    .returning({ id: invitations.id });

  // The plaintext is returned exactly once; it is unrecoverable afterwards.
  return { token, id: row.id };
}

/**
 * Reads an invitation for display on the join page. Returns null for tokens
 * that are unknown, expired, revoked or already used — the caller shows one
 * generic "this link is not valid" message either way, so a probe cannot
 * distinguish "wrong token" from "already used".
 */
export async function peekInvitation(
  token: string,
): Promise<InvitePreview | null> {
  if (!isDbEnabled() || !token) return null;
  const rows = await db
    .select()
    .from(invitations)
    .where(eq(invitations.tokenHash, hashToken(token)))
    .limit(1);
  const invite = rows[0];
  if (!invite) return null;
  if (invite.revokedAt) return null;
  if (invite.acceptedAt) return null;
  if (invite.expiresAt.getTime() < Date.now()) return null;

  return {
    orgType: invite.orgType as OrgType,
    orgName: invite.orgName,
    email: invite.email,
    countryCode: invite.countryCode,
    grantsAdmin: invite.grantsAdmin,
    memberRole: invite.memberRole as MemberRole,
  };
}

export type AcceptResult =
  | { ok: true; orgId: string; orgType: OrgType; grantsAdmin: boolean }
  | { ok: false; error: string };

/**
 * Binds a signed-in user to the invited organization.
 *
 * The single-use guarantee is enforced in the UPDATE's WHERE clause
 * (`acceptedAt IS NULL`) rather than by a read-then-write, so two concurrent
 * clicks on the same link cannot both succeed.
 */
export async function acceptInvitation(
  token: string,
  user: CurrentUser,
): Promise<AcceptResult> {
  if (!isDbEnabled()) return { ok: false, error: "Database unavailable" };
  if (!token) return { ok: false, error: "Missing invitation token" };

  const tokenHash = hashToken(token);
  const rows = await db
    .select()
    .from(invitations)
    .where(eq(invitations.tokenHash, tokenHash))
    .limit(1);
  const invite = rows[0];

  if (!invite || invite.revokedAt) {
    return { ok: false, error: "This invitation link is not valid." };
  }
  if (invite.acceptedAt) {
    return { ok: false, error: "This invitation has already been used." };
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "This invitation has expired." };
  }
  // When an invite names an address, only that address may redeem it.
  if (invite.email && invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return {
      ok: false,
      error: "This invitation was issued to a different email address.",
    };
  }

  const claimed = await db
    .update(invitations)
    .set({ acceptedAt: new Date(), acceptedByUserId: user.id })
    .where(and(eq(invitations.id, invite.id), isNull(invitations.acceptedAt)))
    .returning({ id: invitations.id });

  if (!claimed[0]) {
    return { ok: false, error: "This invitation has already been used." };
  }

  const orgType = invite.orgType as OrgType;
  const org = await ensureOrg({
    userId: user.id,
    type: orgType,
    name: invite.orgName || user.name || user.email,
    countryCode: invite.countryCode,
    memberRole: invite.memberRole as MemberRole,
    // A partner still completes KYC; the invite grants entry, not verification.
    // Platform admins are trusted by definition of who could issue the invite.
    status: orgType === "platform" ? "active" : "incomplete",
  });

  if (!org) return { ok: false, error: "Could not create the organization." };

  if (invite.grantsAdmin) {
    await db
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.id, user.id));
  }

  await recordAudit({
    action: "invitation.accepted",
    actorId: user.id,
    entityType: "organization",
    entityId: org.id,
    metadata: { orgType, grantsAdmin: invite.grantsAdmin, invitationId: invite.id },
  });

  return {
    ok: true,
    orgId: org.id,
    orgType,
    grantsAdmin: invite.grantsAdmin,
  };
}

/** Admin: revoke an unused invitation. */
export async function revokeInvitation(id: string): Promise<boolean> {
  if (!isDbEnabled()) return false;
  await db
    .update(invitations)
    .set({ revokedAt: new Date() })
    .where(and(eq(invitations.id, id), isNull(invitations.acceptedAt)));
  return true;
}

/** Admin: list issued invitations, newest first. */
export async function listInvitations(limit = 100) {
  if (!isDbEnabled()) return [];
  return db
    .select({
      id: invitations.id,
      email: invitations.email,
      orgType: invitations.orgType,
      orgName: invitations.orgName,
      grantsAdmin: invitations.grantsAdmin,
      expiresAt: invitations.expiresAt,
      acceptedAt: invitations.acceptedAt,
      revokedAt: invitations.revokedAt,
      createdAt: invitations.createdAt,
    })
    .from(invitations)
    .orderBy(desc(invitations.createdAt))
    .limit(limit);
}
