import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { savedSearches, users } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { parseListingParams } from "./search-params";
import { searchListings } from "./listings";
import { sendEmail } from "@/lib/notify";
import { brand } from "@/lib/brand";

export type Frequency = "instant" | "daily" | "weekly";

export interface SavedSearchView {
  id: string;
  name: string;
  query: Record<string, string>;
  queryString: string;
  frequency: Frequency;
  createdAt: string;
}

/** How stale a search must be before its alert fires again. */
const FREQ_MS: Record<Frequency, number> = {
  instant: 0,
  daily: 20 * 3600_000,
  weekly: 6.5 * 24 * 3600_000,
};

function toQueryString(q: Record<string, string>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v) sp.set(k, v);
  return sp.toString();
}

function toView(r: {
  id: string;
  name: string | null;
  query: Record<string, string>;
  alertFrequency: string | null;
  createdAt: Date;
}): SavedSearchView {
  return {
    id: r.id,
    name: r.name ?? "Saved search",
    query: r.query ?? {},
    queryString: toQueryString(r.query ?? {}),
    frequency: (r.alertFrequency as Frequency) ?? "daily",
    createdAt: r.createdAt.toISOString(),
  };
}

export async function createSavedSearch(
  userId: string,
  input: { name: string; query: Record<string, string>; frequency: Frequency },
): Promise<{ id: string }> {
  if (!isDbEnabled()) return { id: "demo" };
  const [row] = await db
    .insert(savedSearches)
    .values({
      userId,
      name: input.name,
      query: input.query,
      alertFrequency: input.frequency,
    })
    .returning({ id: savedSearches.id });
  return { id: row.id };
}

export async function listSavedSearches(
  userId: string,
): Promise<SavedSearchView[]> {
  if (!isDbEnabled()) return [];
  const rows = await db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.userId, userId))
    .orderBy(desc(savedSearches.createdAt));
  return rows.map(toView);
}

export async function deleteSavedSearch(
  userId: string,
  id: string,
): Promise<void> {
  if (!isDbEnabled()) return;
  await db
    .delete(savedSearches)
    .where(and(eq(savedSearches.userId, userId), eq(savedSearches.id, id)));
}

/** How many listings match this search that are newer than a given instant. */
export async function countNewMatches(
  query: Record<string, string>,
  since: Date,
): Promise<number> {
  const params = parseListingParams(query);
  params.createdAfter = since;
  params.perPage = 1;
  const res = await searchListings(params);
  return res.total;
}

export interface AlertRunResult {
  processed: number;
  notified: number;
  totalNewListings: number;
}

/**
 * Alert engine. Finds each due saved search's new matches (listings created
 * since its last check), emails the owner a digest, and advances the
 * high-water mark. Call from a scheduled cron (see /api/cron/alerts).
 */
export async function runSavedSearchAlerts(
  opts: { now?: Date } = {},
): Promise<AlertRunResult> {
  if (!isDbEnabled()) return { processed: 0, notified: 0, totalNewListings: 0 };
  const now = opts.now ?? new Date();

  const rows = await db
    .select({
      id: savedSearches.id,
      name: savedSearches.name,
      query: savedSearches.query,
      frequency: savedSearches.alertFrequency,
      lastNotifiedAt: savedSearches.lastNotifiedAt,
      email: users.email,
    })
    .from(savedSearches)
    .innerJoin(users, eq(savedSearches.userId, users.id));

  let processed = 0;
  let notified = 0;
  let totalNew = 0;

  for (const s of rows) {
    const freq = (s.frequency as Frequency) ?? "daily";
    const since = s.lastNotifiedAt ?? now;
    if (now.getTime() - since.getTime() < FREQ_MS[freq]) continue; // not due yet
    processed += 1;

    const params = parseListingParams(s.query);
    params.createdAfter = since;
    params.perPage = 5;
    params.sort = "newest";
    const res = await searchListings(params);

    if (res.total > 0) {
      totalNew += res.total;
      const name = s.name ?? "your saved search";
      const lines = [
        `${res.total} new car${res.total === 1 ? "" : "s"} match "${name}".`,
        "",
        ...res.items.map(
          (l) =>
            `• ${l.year} ${l.make} ${l.model} — AED ${l.priceAED.toLocaleString()} (${l.emirate})`,
        ),
        "",
        `See them all: ${brand.url}/buy?${toQueryString(s.query)}`,
      ];
      const sent = await sendEmail({
        to: s.email,
        subject: `${res.total} new match${res.total === 1 ? "" : "es"} — ${name}`,
        body: lines.join("\n"),
        label: "saved-search alert",
      });
      if (sent) notified += 1;
    }

    await db
      .update(savedSearches)
      .set({ lastNotifiedAt: now })
      .where(eq(savedSearches.id, s.id));
  }

  return { processed, notified, totalNewListings: totalNew };
}
