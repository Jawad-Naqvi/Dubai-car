import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { compareListings } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";

/** Keep the account tray in step with the client cap (MAX_COMPARE). */
export const MAX_COMPARE = 3;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Listing ids in the user's compare tray, newest first. */
export async function getCompareIds(userId: string): Promise<string[]> {
  if (!isDbEnabled()) return [];
  const rows = await db
    .select({ listingId: compareListings.listingId })
    .from(compareListings)
    .where(eq(compareListings.userId, userId))
    .orderBy(desc(compareListings.createdAt))
    .limit(MAX_COMPARE);
  return rows.map((r) => r.listingId);
}

async function count(userId: string): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(compareListings)
    .where(eq(compareListings.userId, userId));
  return row?.c ?? 0;
}

/**
 * Add a listing to the tray (idempotent). Enforces MAX_COMPARE server-side so
 * the cap holds across devices, not just per-browser. Ignores non-UUID ids.
 */
export async function addCompare(
  userId: string,
  listingId: string,
): Promise<{ ok: boolean; full?: boolean }> {
  if (!isDbEnabled() || !UUID_RE.test(listingId)) return { ok: false };
  const existing = await db
    .select({ listingId: compareListings.listingId })
    .from(compareListings)
    .where(
      and(
        eq(compareListings.userId, userId),
        eq(compareListings.listingId, listingId),
      ),
    )
    .limit(1);
  if (existing.length) return { ok: true };
  if ((await count(userId)) >= MAX_COMPARE) return { ok: false, full: true };
  await db
    .insert(compareListings)
    .values({ userId, listingId })
    .onConflictDoNothing();
  return { ok: true };
}

/** Remove a listing from the tray. */
export async function removeCompare(
  userId: string,
  listingId: string,
): Promise<void> {
  if (!isDbEnabled()) return;
  await db
    .delete(compareListings)
    .where(
      and(
        eq(compareListings.userId, userId),
        eq(compareListings.listingId, listingId),
      ),
    );
}

/** Empty the user's compare tray. */
export async function clearCompare(userId: string): Promise<void> {
  if (!isDbEnabled()) return;
  await db.delete(compareListings).where(eq(compareListings.userId, userId));
}

/**
 * Merge a signed-out browser's local tray into the account on first login,
 * respecting MAX_COMPARE. Only real UUID ids are persisted.
 */
export async function mergeCompare(
  userId: string,
  listingIds: string[],
): Promise<void> {
  if (!isDbEnabled()) return;
  const incoming = [...new Set(listingIds)].filter((id) => UUID_RE.test(id));
  if (incoming.length === 0) return;
  const room = MAX_COMPARE - (await count(userId));
  if (room <= 0) return;
  await db
    .insert(compareListings)
    .values(incoming.slice(0, room).map((listingId) => ({ userId, listingId })))
    .onConflictDoNothing();
}
