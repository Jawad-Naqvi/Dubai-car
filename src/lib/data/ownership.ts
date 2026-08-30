import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings, dealers } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { demoStore } from "./demo-store";

/**
 * Does this user own this listing?
 *
 * Used to stop people transacting with themselves — messaging, quoting or
 * reserving your own car creates junk leads, junk orders and a confusing
 * "Seller" conversation with yourself in the inbox.
 */
export async function ownsListing(
  listingId: string | undefined,
  userId: string | undefined,
): Promise<boolean> {
  if (!listingId || !userId) return false;

  if (!isDbEnabled()) {
    const l = demoStore().newListings.find((x) => x.id === listingId);
    return !!l && l.ownerUserId === userId;
  }

  try {
    const [row] = await db
      .select({ sellerId: listings.sellerId, dealerId: listings.dealerId })
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);
    if (!row) return false;
    if (row.sellerId && row.sellerId === userId) return true;
    if (row.dealerId) {
      const [d] = await db
        .select({ userId: dealers.userId })
        .from(dealers)
        .where(eq(dealers.id, row.dealerId))
        .limit(1);
      if (d?.userId === userId) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Message shown whenever someone tries to transact with their own listing. */
export const OWN_LISTING_ERROR =
  "This is your own listing — you can manage it from My listings.";
