import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { identityDocuments, organizations, users } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { getOrSyncUser, type CurrentUser } from "@/lib/data/users";
import {
  backfillOrgForUser,
  ensureOrg,
  getMyOrgs,
  type OrgContext,
  type OrgType,
} from "@/lib/data/orgs";
import { getKycProgress, type KycProgress } from "@/lib/data/countries";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * PROGRESSIVE ONBOARDING.
 *
 * Every account is created identically — a plain buyer, from the one sign-up
 * page. Nothing about who you are is decided by a URL you clicked. After
 * signing in you say what you're here to do, and only then are you asked for
 * the documents your country and party type require.
 *
 * Two states are deliberately distinct, because conflating them is what made
 * the old flow feel broken:
 *
 *   ROLE       what workspace you see        granted as soon as you choose
 *   VERIFIED   what you are allowed to do    granted when an admin approves
 *
 * So a new dealership gets its seller workspace immediately and can prepare
 * inventory, while publishing stays blocked until KYC passes. Skipping the
 * upload is always allowed and always leaves a visible "pending" state rather
 * than a silently half-built account.
 *
 * Freight forwarders are absent from this flow on purpose — they arrive only
 * through an admin invitation (see lib/data/invitations.ts).
 */

/** The party types a person may choose for themselves on the public site. */
export const SELF_SERVE_TYPES = ["buyer", "dealer"] as const;
export type SelfServeType = (typeof SELF_SERVE_TYPES)[number];

export interface OnboardingState {
  user: CurrentUser;
  orgs: OrgContext[];
  /** The org that decides which workspace to open. */
  primary: OrgContext | null;
  /** True until the user has picked what they're here to do. */
  needsTypeChoice: boolean;
  kyc: KycProgress | null;
  /** Everything required is submitted and approved. */
  isVerified: boolean;
  /** Submitted, waiting on an admin. */
  isPending: boolean;
  /** Chose a type but skipped the documents. */
  needsDocuments: boolean;
}

/**
 * Resolves where a signed-in user is in onboarding. Safe to call on every
 * authenticated page — it backfills an org for accounts that predate the
 * organization model rather than failing on them.
 */
export async function getOnboardingState(): Promise<OnboardingState | null> {
  if (!isDbEnabled()) return null;
  const user = await getOrSyncUser().catch(() => null);
  if (!user) return null;

  let orgs = await getMyOrgs();
  if (orgs.length === 0) {
    // Pre-existing account: give it the org its current data implies.
    await backfillOrgForUser(user).catch(() => null);
    orgs = await getMyOrgs();
  }

  const primary = pickPrimaryOrg(orgs);

  // "Has this person told us what they're here to do?"
  //
  // A dealer/forwarder/platform org is an explicit answer. So is a buyer org
  // that chooseAccountType() promoted to "active". An auto-created buyer org
  // still sitting at "incomplete" is NOT an answer — it is the placeholder we
  // made for them — so the picker is still owed.
  const needsTypeChoice =
    !primary || (primary.type === "buyer" && primary.status === "incomplete");

  const kyc = primary
    ? await getKycProgress(primary.countryCode, primary.type, {
        orgId: primary.id,
        userId: user.id,
      })
    : null;

  return {
    user,
    orgs,
    primary,
    needsTypeChoice,
    kyc,
    isVerified: !!primary?.isVerified,
    isPending: !!primary?.isPending,
    needsDocuments: !!primary && !primary.isVerified && !!kyc && !kyc.complete,
  };
}

/**
 * Dealer beats buyer when someone holds both: the seller workspace is the
 * one with work in it, and a dealer is always also able to buy.
 */
function pickPrimaryOrg(orgs: OrgContext[]): OrgContext | null {
  const order: OrgType[] = ["platform", "forwarder", "dealer", "buyer"];
  for (const t of order) {
    const found = orgs.find((o) => o.type === t);
    if (found) return found;
  }
  return orgs[0] ?? null;
}

export type ChooseResult =
  | { ok: true; orgId: string; type: SelfServeType }
  | { ok: false; error: string };

/**
 * Records what the user is here to do and opens the matching workspace.
 *
 * Only buyer and dealer are accepted. A request naming "forwarder" or
 * "platform" is refused no matter how it was crafted, because those roles
 * exist only behind an admin invitation.
 */
export async function chooseAccountType(input: {
  type: string;
  organizationName?: string;
  countryCode?: string;
}): Promise<ChooseResult> {
  if (!isDbEnabled()) return { ok: false, error: "Database unavailable" };

  const user = await getOrSyncUser().catch(() => null);
  if (!user) return { ok: false, error: "Sign in to continue." };

  if (!SELF_SERVE_TYPES.includes(input.type as SelfServeType)) {
    return {
      ok: false,
      error: "Freight forwarder and admin accounts are invitation only.",
    };
  }
  const type = input.type as SelfServeType;

  const name =
    input.organizationName?.trim() ||
    user.name ||
    user.email ||
    (type === "dealer" ? "My dealership" : "My account");

  const org = await ensureOrg({
    userId: user.id,
    type,
    name,
    countryCode: input.countryCode ?? "AE",
    // A buyer needs nothing more to browse and buy; a dealer owes documents.
    status: type === "buyer" ? "active" : "incomplete",
  });
  if (!org) return { ok: false, error: "Could not set up your account." };

  // ensureOrg is idempotent — when an org already exists it returns it
  // UNCHANGED, including its status. Onboarding always finds one, because a
  // placeholder buyer org is created the first time the user is seen. Without
  // this explicit promotion the choice never persisted: the placeholder stayed
  // "incomplete", so the picker reappeared on every visit and the user could
  // never get past it.
  if (type === "buyer" && org.status !== "active") {
    await db
      .update(organizations)
      .set({ status: "active", name, updatedAt: new Date() })
      .where(eq(organizations.id, org.id));
    org.status = "active";
    org.isVerified = true;
  } else if (type === "dealer" && input.organizationName?.trim()) {
    // Keep the business name the seller actually typed.
    await db
      .update(organizations)
      .set({ name, updatedAt: new Date() })
      .where(eq(organizations.id, org.id));
  }

  // Give the dealer their workspace now; publishing stays gated on approval.
  if (type === "dealer" && user.role !== "dealer" && user.role !== "admin") {
    await db.update(users).set({ role: "dealer" }).where(eq(users.id, user.id));
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(user.clerkId, {
        publicMetadata: { role: "dealer" },
      });
    } catch {
      // The DB role is authoritative for this request; Clerk reconciles later.
    }
  }

  return { ok: true, orgId: org.id, type };
}

/**
 * Records a submitted document and moves the org to "pending" once every
 * required item is in. Uploading is never mandatory to proceed — the caller
 * may simply not call this, which leaves the org "incomplete" and surfaces a
 * banner instead of blocking the account.
 */
export async function submitOnboardingDocument(input: {
  orgId: string;
  docType: string;
  docNumber?: string;
  frontMediaId?: string;
  backMediaId?: string;
}): Promise<{ ok: boolean; error?: string; status?: string }> {
  if (!isDbEnabled()) return { ok: false, error: "Database unavailable" };

  const user = await getOrSyncUser().catch(() => null);
  if (!user) return { ok: false, error: "Sign in to continue." };

  const orgs = await getMyOrgs();
  const org = orgs.find((o) => o.id === input.orgId);
  if (!org) return { ok: false, error: "Not allowed" };

  const existing = await db
    .select({ id: identityDocuments.id })
    .from(identityDocuments)
    .where(
      and(
        eq(identityDocuments.orgId, org.id),
        eq(identityDocuments.docType, input.docType),
      ),
    )
    .limit(1);

  const values = {
    userId: user.id,
    orgId: org.id,
    countryCode: org.countryCode,
    docType: input.docType,
    docNumber: input.docNumber ?? null,
    frontMediaId: input.frontMediaId ?? null,
    backMediaId: input.backMediaId ?? null,
    status: "pending" as const,
    rejectionReason: null,
    submittedAt: new Date(),
  };

  if (existing[0]) {
    // Re-submitting after a rejection replaces the previous attempt.
    await db
      .update(identityDocuments)
      .set(values)
      .where(eq(identityDocuments.id, existing[0].id));
  } else {
    await db.insert(identityDocuments).values(values);
  }

  const progress = await getKycProgress(org.countryCode, org.type, {
    orgId: org.id,
  });

  if (progress.complete && org.status !== "active") {
    await db
      .update(organizations)
      .set({
        status: "pending",
        submittedAt: new Date(),
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, org.id));
    return { ok: true, status: "pending" };
  }

  return { ok: true, status: org.status };
}

/**
 * Where to send someone after signing in. Used by /post-auth so the single
 * login lands each account in its own place.
 */
export async function resolvePostAuthPath(locale: string): Promise<string> {
  const state = await getOnboardingState();
  if (!state) return `/${locale}`;

  if (state.needsTypeChoice) return `/${locale}/welcome`;

  const type = state.primary?.type;
  if (type === "platform" || state.user.role === "admin") {
    return `/${locale}/admin`;
  }
  if (type === "forwarder") return `/${locale}/dashboard/freight`;
  if (type === "dealer") return `/${locale}/dashboard`;

  // Buyers browse the marketplace; their account lives in the drawer.
  return `/${locale}`;
}
