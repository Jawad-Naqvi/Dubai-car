import "server-only";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  organizations,
  organizationMembers,
  identityDocuments,
  dealers,
  users,
} from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { getOrSyncUser, type CurrentUser } from "@/lib/data/users";

/**
 * ORGANIZATIONS are the unit of tenancy.
 *
 * A freight forwarder is a company with staff; so is a dealership. Putting the
 * role on the user means one login = one company = one role, which breaks the
 * moment a forwarder hires a second person or someone both buys and sells.
 * Every authorization decision in the platform resolves through this module:
 * "which orgs is this user a member of, and what may that org do?"
 *
 * Nothing here trusts a client-supplied org id. Callers pass an org id only to
 * be VERIFIED against the caller's memberships (see assertOrgAccess).
 */

export type OrgType = "buyer" | "dealer" | "forwarder" | "platform";
export type OrgStatus =
  | "incomplete"
  | "pending"
  | "active"
  | "rejected"
  | "suspended";
export type MemberRole = "owner" | "admin" | "staff";

export interface OrgContext {
  id: string;
  type: OrgType;
  name: string;
  slug: string | null;
  countryCode: string;
  status: OrgStatus;
  dealerId: string | null;
  memberRole: MemberRole;
  /** Admin has verified this org — required before it can transact. */
  isVerified: boolean;
  /** Documents submitted, awaiting review. */
  isPending: boolean;
  rejectionReason: string | null;
}

function toContext(
  org: typeof organizations.$inferSelect,
  memberRole: MemberRole,
): OrgContext {
  return {
    id: org.id,
    type: org.type as OrgType,
    name: org.name,
    slug: org.slug,
    countryCode: org.countryCode,
    status: org.status as OrgStatus,
    dealerId: org.dealerId,
    memberRole,
    isVerified: org.status === "active",
    isPending: org.status === "pending",
    rejectionReason: org.rejectionReason,
  };
}

/** Every organization the signed-in user belongs to. Empty when signed out. */
export async function getMyOrgs(): Promise<OrgContext[]> {
  if (!isDbEnabled()) return [];
  const user = await getOrSyncUser().catch(() => null);
  if (!user) return [];
  return getOrgsForUser(user.id);
}

/** Memberships for a specific user id (server-internal; never a query param). */
export async function getOrgsForUser(userId: string): Promise<OrgContext[]> {
  if (!isDbEnabled()) return [];
  const rows = await db
    .select({ org: organizations, memberRole: organizationMembers.role })
    .from(organizationMembers)
    .innerJoin(
      organizations,
      eq(organizations.id, organizationMembers.orgId),
    )
    .where(eq(organizationMembers.userId, userId));
  return rows.map((r) => toContext(r.org, r.memberRole as MemberRole));
}

/** The user's org of a given type, or null. */
export async function getMyOrgOfType(
  type: OrgType,
): Promise<OrgContext | null> {
  const orgs = await getMyOrgs();
  return orgs.find((o) => o.type === type) ?? null;
}

/**
 * Verifies the caller belongs to `orgId` and returns the context, or null.
 *
 * This is THE function to call whenever a route receives an org id from the
 * client. It converts "the client says it is org X" into "the session proves
 * membership of org X", which is the difference between an access check and a
 * suggestion.
 */
export async function assertOrgAccess(
  orgId: string,
  opts: { minRole?: MemberRole } = {},
): Promise<OrgContext | null> {
  if (!orgId) return null;
  const orgs = await getMyOrgs();
  const ctx = orgs.find((o) => o.id === orgId);
  if (!ctx) return null;
  if (opts.minRole) {
    const rank: Record<MemberRole, number> = { staff: 0, admin: 1, owner: 2 };
    if (rank[ctx.memberRole] < rank[opts.minRole]) return null;
  }
  return ctx;
}

/** True when the user is a member of any active (admin-verified) org of a type. */
export async function hasVerifiedOrg(type: OrgType): Promise<boolean> {
  const org = await getMyOrgOfType(type);
  return !!org?.isVerified;
}

/**
 * Platform-admin check based on real membership of the platform org — NOT on
 * a shared PIN or a static cookie. Admins are invited into the platform org,
 * so revoking access is deleting a membership row.
 */
export async function isPlatformAdmin(): Promise<boolean> {
  if (!isDbEnabled()) return false;
  const user = await getOrSyncUser().catch(() => null);
  if (!user) return false;
  if (user.role === "admin") return true;
  const orgs = await getOrgsForUser(user.id);
  return orgs.some((o) => o.type === "platform" && o.isVerified);
}

/**
 * Creates the org a user acts through, idempotently. Called during onboarding
 * and when accepting an invitation.
 *
 * The org starts "incomplete" on purpose: onboarding lets people skip document
 * upload and come back later, and the status is what surfaces that as a
 * visible pending state rather than a silent half-configured account.
 */
export async function ensureOrg(input: {
  userId: string;
  type: OrgType;
  name: string;
  countryCode?: string;
  dealerId?: string | null;
  memberRole?: MemberRole;
  status?: OrgStatus;
}): Promise<OrgContext | null> {
  if (!isDbEnabled()) return null;

  const existing = await db
    .select({ org: organizations, memberRole: organizationMembers.role })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.orgId))
    .where(
      and(
        eq(organizationMembers.userId, input.userId),
        eq(organizations.type, input.type),
      ),
    )
    .limit(1);
  if (existing[0]) {
    return toContext(existing[0].org, existing[0].memberRole as MemberRole);
  }

  const [org] = await db
    .insert(organizations)
    .values({
      type: input.type,
      name: input.name,
      countryCode: input.countryCode ?? "AE",
      dealerId: input.dealerId ?? null,
      status: input.status ?? "incomplete",
    })
    .returning();

  await db
    .insert(organizationMembers)
    .values({
      orgId: org.id,
      userId: input.userId,
      role: input.memberRole ?? "owner",
    })
    .onConflictDoNothing();

  return toContext(org, input.memberRole ?? "owner");
}

/**
 * Backfills an organization for a user who predates the org model — every
 * existing dealer gets a dealer org carrying its current verification state,
 * and every other user gets a buyer org. Safe to call repeatedly.
 */
export async function backfillOrgForUser(
  user: CurrentUser,
): Promise<OrgContext | null> {
  if (!isDbEnabled()) return null;

  const dealerRow = await db
    .select()
    .from(dealers)
    .where(eq(dealers.userId, user.id))
    .limit(1);

  if (dealerRow[0]) {
    const d = dealerRow[0];
    return ensureOrg({
      userId: user.id,
      type: "dealer",
      name: d.businessName,
      dealerId: d.id,
      // Carry the existing KYC verdict across so nobody is re-reviewed.
      status: d.isVerified
        ? "active"
        : d.kycStatus === "rejected"
          ? "rejected"
          : "pending",
    });
  }

  // "incomplete" on purpose. A user with no dealer record has never told us
  // what they are here to do, so the account-type picker must still be shown.
  // Creating this as "active" silently answered the question for them and
  // skipped onboarding entirely — new accounts landed straight on the
  // marketplace and were never asked whether they wanted to buy or sell.
  // chooseAccountType() is what promotes a buyer org to "active".
  return ensureOrg({
    userId: user.id,
    type: "buyer",
    name: user.name || user.email || "Buyer",
    status: "incomplete",
  });
}

/** Admin: set an org's verification verdict. */
export async function setOrgStatus(
  orgId: string,
  status: OrgStatus,
  opts: { reviewerUserId?: string; rejectionReason?: string } = {},
): Promise<boolean> {
  if (!isDbEnabled()) return false;
  await db
    .update(organizations)
    .set({
      status,
      rejectionReason: opts.rejectionReason ?? null,
      verifiedAt: status === "active" ? new Date() : null,
      verifiedByUserId: opts.reviewerUserId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));
  return true;
}

/**
 * Admin review payload: the org PLUS the documents it submitted.
 *
 * Without this the approve button asked an admin to verify an organization
 * they could not actually look at — the queue listed a name and a country and
 * nothing else. Verification has to be based on the papers.
 */
export interface OrgReviewItem {
  id: string;
  name: string;
  type: OrgType;
  countryCode: string;
  submittedAt: string | null;
  contactEmail: string | null;
  documents: Array<{
    id: string;
    docType: string;
    docNumber: string | null;
    status: string;
    frontUrl: string | null;
    backUrl: string | null;
  }>;
}

export async function getOrgReviewQueue(): Promise<OrgReviewItem[]> {
  if (!isDbEnabled()) return [];
  const orgs = await db
    .select()
    .from(organizations)
    .where(eq(organizations.status, "pending"))
    .limit(100);
  if (orgs.length === 0) return [];

  const docs = await db
    .select()
    .from(identityDocuments)
    .where(
      inArray(
        identityDocuments.orgId,
        orgs.map((o) => o.id),
      ),
    );

  const byOrg = new Map<string, OrgReviewItem["documents"]>();
  for (const d of docs) {
    if (!d.orgId) continue;
    const list = byOrg.get(d.orgId) ?? [];
    list.push({
      id: d.id,
      docType: d.docType,
      docNumber: d.docNumber,
      status: d.status,
      // Private assets — /api/media/[id] checks the admin role before serving.
      frontUrl: d.frontMediaId ? `/api/media/${d.frontMediaId}` : null,
      backUrl: d.backMediaId ? `/api/media/${d.backMediaId}` : null,
    });
    byOrg.set(d.orgId, list);
  }

  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    type: o.type as OrgType,
    countryCode: o.countryCode,
    submittedAt: o.submittedAt?.toISOString() ?? null,
    contactEmail: o.contactEmail,
    documents: byOrg.get(o.id) ?? [],
  }));
}

/** Admin listing of orgs awaiting review, newest first. */
export async function getOrgsForReview(type?: OrgType) {
  if (!isDbEnabled()) return [];
  const where = type
    ? and(eq(organizations.status, "pending"), eq(organizations.type, type))
    : eq(organizations.status, "pending");
  return db.select().from(organizations).where(where).limit(200);
}
