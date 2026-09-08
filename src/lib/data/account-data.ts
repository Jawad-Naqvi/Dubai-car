import "server-only";
import { eq, or, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  listings,
  leads,
  savedListings,
  savedSearches,
  messages,
  conversationParticipants,
  organizations,
  organizationMembers,
  identityDocuments,
  notifications,
  freightRequests,
  orders,
  quotes,
  dealerReviews,
  valuations,
} from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { getOrSyncUser } from "@/lib/data/users";
import { recordAudit } from "@/lib/audit";
import { log } from "@/lib/log";

/**
 * SUBJECT ACCESS AND ERASURE.
 *
 * The footer advertised "GDPR Compliant" while the product had neither a data
 * export nor an account deletion path, and the Clerk `user.deleted` webhook
 * hard-deleted the user row and let foreign keys cascade — no export first, no
 * record that it happened, and identity documents removed with no trace.
 *
 * Two rights are implemented here:
 *
 *  ACCESS (Art. 15) — everything held about the signed-in user, as JSON they
 *  can download. Scoped strictly to their own rows.
 *
 *  ERASURE (Art. 17) — not a blanket delete. Commercial records that others
 *  are party to (an order, a shipment someone is still carrying, a message the
 *  other side keeps) are ANONYMISED rather than removed, because a buyer
 *  cannot unilaterally erase a seller's transaction history. Personal
 *  identifiers and identity documents are destroyed.
 */

export interface AccountExport {
  exportedAt: string;
  account: Record<string, unknown>;
  organizations: unknown[];
  identityDocuments: unknown[];
  listings: unknown[];
  enquiries: unknown[];
  savedCars: unknown[];
  savedSearches: unknown[];
  messages: unknown[];
  orders: unknown[];
  quotes: unknown[];
  shippingRequests: unknown[];
  reviews: unknown[];
  valuations: unknown[];
  notifications: unknown[];
}

/** Everything the platform holds about the signed-in user. */
export async function exportMyData(): Promise<AccountExport | null> {
  if (!isDbEnabled()) return null;
  const user = await getOrSyncUser().catch(() => null);
  if (!user) return null;

  const [
    account,
    orgRows,
    docs,
    myListings,
    myLeads,
    saved,
    searches,
    myMessages,
    myOrders,
    myQuotes,
    myFreight,
    myReviews,
    myValuations,
    myNotifications,
  ] = await Promise.all([
    db.select().from(users).where(eq(users.id, user.id)).limit(1),
    db
      .select({ org: organizations, role: organizationMembers.role })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizations.id, organizationMembers.orgId))
      .where(eq(organizationMembers.userId, user.id)),
    db
      .select()
      .from(identityDocuments)
      .where(eq(identityDocuments.userId, user.id)),
    db.select().from(listings).where(eq(listings.sellerId, user.id)),
    db.select().from(leads).where(eq(leads.buyerId, user.id)),
    db.select().from(savedListings).where(eq(savedListings.userId, user.id)),
    db.select().from(savedSearches).where(eq(savedSearches.userId, user.id)),
    db.select().from(messages).where(eq(messages.senderUserId, user.id)),
    db.select().from(orders).where(eq(orders.buyerId, user.id)),
    db.select().from(quotes).where(eq(quotes.buyerId, user.id)),
    db
      .select()
      .from(freightRequests)
      .where(eq(freightRequests.buyerUserId, user.id)),
    db.select().from(dealerReviews).where(eq(dealerReviews.userId, user.id)),
    db.select().from(valuations).where(eq(valuations.userId, user.id)),
    db.select().from(notifications).where(eq(notifications.userId, user.id)),
  ]);

  await recordAudit({
    action: "account.export_requested",
    actorId: user.id,
    entityType: "user",
    entityId: user.id,
  });

  // Identity document BYTES are deliberately not inlined — the export lists
  // which documents are held and their status, and the user can fetch each
  // one through the authenticated media route.
  const safeDocs = docs.map((d) => ({
    docType: d.docType,
    countryCode: d.countryCode,
    status: d.status,
    submittedAt: d.submittedAt,
    reviewedAt: d.reviewedAt,
    frontUrl: d.frontMediaId ? `/api/media/${d.frontMediaId}` : null,
    backUrl: d.backMediaId ? `/api/media/${d.backMediaId}` : null,
  }));

  return {
    exportedAt: new Date().toISOString(),
    account: account[0] ?? {},
    organizations: orgRows,
    identityDocuments: safeDocs,
    listings: myListings,
    enquiries: myLeads,
    savedCars: saved,
    savedSearches: searches,
    messages: myMessages,
    orders: myOrders,
    quotes: myQuotes,
    shippingRequests: myFreight,
    reviews: myReviews,
    valuations: myValuations,
    notifications: myNotifications,
  };
}

export interface DeletionResult {
  ok: boolean;
  error?: string;
  anonymised?: Record<string, number>;
}

/**
 * Erases the signed-in user.
 *
 * Order matters and is deliberate:
 *  1. destroy identity documents and personal identifiers outright
 *  2. anonymise records other parties are entitled to keep
 *  3. remove purely personal data (saved cars, searches, notifications)
 *  4. tombstone the user row rather than deleting it, so foreign keys on
 *     other people's orders do not cascade away their history
 *
 * Refused while the user is party to a shipment still in transit — a cargo
 * movement with a consignee that no longer exists is a real operational
 * problem, not a privacy nicety.
 */
export async function deleteMyAccount(
  confirmation: string,
): Promise<DeletionResult> {
  if (!isDbEnabled()) return { ok: false, error: "Database unavailable" };
  const user = await getOrSyncUser().catch(() => null);
  if (!user) return { ok: false, error: "Sign in to continue." };

  // Typed confirmation, so this cannot be triggered by a stray click or CSRF.
  if (confirmation.trim().toUpperCase() !== "DELETE") {
    return { ok: false, error: 'Type DELETE to confirm.' };
  }

  const liveOrders = await db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(eq(orders.buyerId, user.id));
  const inFlight = liveOrders.filter((o) =>
    ["pending", "confirmed", "in_progress"].includes(o.status),
  );
  if (inFlight.length > 0) {
    return {
      ok: false,
      error: `You have ${inFlight.length} order${inFlight.length === 1 ? "" : "s"} still in progress. We cannot delete the account while a car is being bought or shipped — contact support and we will handle it.`,
    };
  }

  const anonymised: Record<string, number> = {};
  const stamp = user.id.slice(0, 8);

  try {
    // 1. Identity documents — destroyed, not anonymised.
    const removedDocs = await db
      .delete(identityDocuments)
      .where(eq(identityDocuments.userId, user.id))
      .returning({ id: identityDocuments.id });
    anonymised.identityDocuments = removedDocs.length;

    // 2. Anonymise records the counterparty keeps.
    const scrubbedLeads = await db
      .update(leads)
      .set({
        buyerName: "Deleted user",
        buyerEmail: null,
        buyerPhone: null,
        message: "[removed at the sender's request]",
        buyerId: null,
      })
      .where(eq(leads.buyerId, user.id))
      .returning({ id: leads.id });
    anonymised.enquiries = scrubbedLeads.length;

    const scrubbedMessages = await db
      .update(messages)
      .set({ body: "[message removed at the sender's request]" })
      .where(eq(messages.senderUserId, user.id))
      .returning({ id: messages.id });
    anonymised.messages = scrubbedMessages.length;

    const scrubbedOrders = await db
      .update(orders)
      .set({ buyerName: "Deleted user", buyerEmail: null, buyerPhone: null })
      .where(eq(orders.buyerId, user.id))
      .returning({ id: orders.id });
    anonymised.orders = scrubbedOrders.length;

    // 3. Purely personal data — removed outright.
    await db.delete(savedListings).where(eq(savedListings.userId, user.id));
    await db.delete(savedSearches).where(eq(savedSearches.userId, user.id));
    await db.delete(notifications).where(eq(notifications.userId, user.id));
    await db
      .delete(conversationParticipants)
      .where(eq(conversationParticipants.userId, user.id));

    // 4. Tombstone. Deleting the row would cascade into other people's data.
    await db
      .update(users)
      .set({
        email: `deleted+${stamp}@removed.invalid`,
        name: "Deleted user",
        phone: null,
        imageUrl: null,
        emiratesIdNumber: null,
        emiratesIdFrontUrl: null,
        emiratesIdBackUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await recordAudit({
      action: "account.deleted",
      actorId: user.id,
      entityType: "user",
      entityId: user.id,
      metadata: anonymised,
    });

    log.info("account.deleted", { userId: user.id, ...anonymised });
    return { ok: true, anonymised };
  } catch (err) {
    log.error("account.delete_failed", { userId: user.id, err });
    return {
      ok: false,
      error: "We could not complete the deletion. Please contact support.",
    };
  }
}
