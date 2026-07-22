import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { savedListings } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Listing ids the user has saved, newest first. */
export async function getSavedIds(userId: string): Promise<string[]> {
  if (!isDbEnabled()) return [];
  const rows = await db
    .select({ listingId: savedListings.listingId })
    .from(savedListings)
    .where(eq(savedListings.userId, userId))
    .orderBy(desc(savedListings.createdAt));
  return rows.map((r) => r.listingId);
}

/** Save a listing for a user (idempotent). Ignores non-UUID (mock) ids. */
export async function saveListing(
  userId: string,
  listingId: string,
): Promise<void> {
  if (!isDbEnabled() || !UUID_RE.test(listingId)) return;
  await db
    .insert(savedListings)
    .values({ userId, listingId })
    .onConflictDoNothing();
}

/** Remove a saved listing for a user. */
export async function unsaveListing(
  userId: string,
  listingId: string,
): Promise<void> {
  if (!isDbEnabled()) return;
  await db
    .delete(savedListings)
    .where(
      and(
        eq(savedListings.userId, userId),
        eq(savedListings.listingId, listingId),
      ),
    );
}

/**
 * Merge a set of ids (e.g. from a signed-out browser's localStorage) into the
 * user's account on first login. Only real UUID ids are persisted.
 */
export async function mergeSaved(
  userId: string,
  listingIds: string[],
): Promise<void> {
  if (!isDbEnabled()) return;
  const ids = [...new Set(listingIds)].filter((id) => UUID_RE.test(id));
  if (ids.length === 0) return;
  await db
    .insert(savedListings)
    .values(ids.map((listingId) => ({ userId, listingId })))
    .onConflictDoNothing();
}

/** Filter a list of ids down to the ones this user has saved (for card state). */
export async function filterSavedIds(
  userId: string,
  listingIds: string[],
): Promise<string[]> {
  if (!isDbEnabled() || listingIds.length === 0) return [];
  const rows = await db
    .select({ listingId: savedListings.listingId })
    .from(savedListings)
    .where(
      and(
        eq(savedListings.userId, userId),
        inArray(savedListings.listingId, listingIds),
      ),
    );
  return rows.map((r) => r.listingId);
}
