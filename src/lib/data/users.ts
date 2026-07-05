import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, dealers, type User } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";

export type Role = "buyer" | "dealer" | "b2b_importer" | "admin";

/** Role from Clerk publicMetadata (source of truth for RBAC). */
export async function getCurrentRole(): Promise<Role> {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: Role } | undefined)?.role;
  return role ?? "buyer";
}

/** True when dashboards/admin are intentionally opened for testing. */
export function dashboardsOpen(): boolean {
  return !isDbEnabled() || process.env.OPEN_DASHBOARDS === "true";
}

/**
 * Admin guard for API routes. Open in demo mode or when OPEN_DASHBOARDS=true (for
 * testing against a live DB); otherwise requires the Clerk admin role.
 */
export async function isAdminAllowed(): Promise<boolean> {
  if (dashboardsOpen()) return true;
  return (await getCurrentRole()) === "admin";
}

export interface CurrentUser {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  role: Role;
  imageUrl?: string;
}

/**
 * Returns the internal user row for the signed-in Clerk user, creating it on
 * first sight (the webhook also does this in production, but this guarantees a
 * row exists for any authed action). Returns null when signed out. In demo
 * mode (no DB) it returns a lightweight identity derived from Clerk.
 */
export async function getOrSyncUser(): Promise<CurrentUser | null> {
  const cu = await currentUser();
  if (!cu) return null;

  const email = cu.emailAddresses[0]?.emailAddress ?? "";
  const name =
    [cu.firstName, cu.lastName].filter(Boolean).join(" ") || cu.username || "User";
  const role = ((cu.publicMetadata as { role?: Role })?.role ?? "buyer") as Role;

  if (!isDbEnabled()) {
    return {
      id: `demo-${cu.id}`,
      clerkId: cu.id,
      email,
      name,
      role,
      imageUrl: cu.imageUrl,
    };
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, cu.id))
    .limit(1);

  let row: User;
  if (existing[0]) {
    row = existing[0];
  } else {
    const [created] = await db
      .insert(users)
      .values({
        clerkId: cu.id,
        email,
        name,
        imageUrl: cu.imageUrl,
        role,
      })
      .onConflictDoNothing()
      .returning();
    row =
      created ??
      (
        await db
          .select()
          .from(users)
          .where(eq(users.clerkId, cu.id))
          .limit(1)
      )[0];
  }

  return {
    id: row.id,
    clerkId: row.clerkId,
    email: row.email,
    name: row.name ?? name,
    role: row.role,
    imageUrl: row.imageUrl ?? undefined,
  };
}

/** The dealer record owned by the current user, if any. */
export async function getCurrentDealer() {
  if (!isDbEnabled()) return null;
  const u = await getOrSyncUser();
  if (!u) return null;
  const rows = await db
    .select()
    .from(dealers)
    .where(eq(dealers.userId, u.id))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Dealer context for the dashboard. Uses the signed-in user's dealer; when
 * dashboards are open for testing and the user has none, falls back to the
 * first seeded dealer so the dashboard shows real data.
 */
export async function getEffectiveDealer() {
  if (!isDbEnabled()) return null;
  const own = await getCurrentDealer();
  if (own) return own;
  if (process.env.OPEN_DASHBOARDS === "true") {
    // Deterministic pick so the dashboard always shows the same dealer.
    const rows = await db
      .select()
      .from(dealers)
      .orderBy(dealers.businessName)
      .limit(1);
    return rows[0] ?? null;
  }
  return null;
}
