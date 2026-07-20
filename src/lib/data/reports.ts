import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { listingReports, listings } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";

export const REPORT_REASONS = [
  "Scam or fraud",
  "Wrong or misleading info",
  "Already sold",
  "Duplicate listing",
  "Offensive content",
  "Other",
] as const;

export interface ReportInput {
  listingId: string;
  reason: string;
  details?: string;
  reporterEmail?: string;
  reporterId?: string;
}

export async function createReport(
  input: ReportInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!isDbEnabled()) return { ok: true }; // demo: accept silently
  if (!input.listingId || !input.reason) {
    return { ok: false, error: "listingId and reason required" };
  }
  try {
    await db.insert(listingReports).values({
      listingId: input.listingId,
      reason: input.reason.slice(0, 64),
      details: input.details?.slice(0, 2000),
      reporterEmail: input.reporterEmail?.slice(0, 200),
      reporterId: input.reporterId,
      status: "open",
    });
    return { ok: true };
  } catch {
    // Bad UUID / FK miss → treat as a soft failure, don't 500 the reporter.
    return { ok: false, error: "Could not file report" };
  }
}

export interface ReportView {
  id: string;
  listingId: string;
  listingTitle: string;
  reason: string;
  details: string;
  reporterEmail: string;
  status: string;
  createdAt: string;
}

/** Admin queue: reports joined to their listing, newest first. */
export async function listReports(status?: string): Promise<ReportView[]> {
  if (!isDbEnabled()) return [];
  const rows = await db
    .select({
      id: listingReports.id,
      listingId: listingReports.listingId,
      reason: listingReports.reason,
      details: listingReports.details,
      reporterEmail: listingReports.reporterEmail,
      status: listingReports.status,
      createdAt: listingReports.createdAt,
      make: listings.make,
      model: listings.model,
      year: listings.year,
    })
    .from(listingReports)
    .leftJoin(listings, eq(listingReports.listingId, listings.id))
    .orderBy(desc(listingReports.createdAt))
    .limit(200);
  return rows
    .filter((r) => !status || r.status === status)
    .map((r) => ({
      id: r.id,
      listingId: r.listingId,
      listingTitle: r.make ? `${r.year} ${r.make} ${r.model}` : "(deleted listing)",
      reason: r.reason,
      details: r.details ?? "",
      reporterEmail: r.reporterEmail ?? "",
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));
}

export async function updateReportStatus(
  id: string,
  status: string,
): Promise<void> {
  if (!isDbEnabled()) return;
  await db
    .update(listingReports)
    .set({ status })
    .where(eq(listingReports.id, id));
}

/** Count of open reports — for an admin nav badge. */
export async function openReportCount(): Promise<number> {
  if (!isDbEnabled()) return 0;
  const rows = await db
    .select({ id: listingReports.id })
    .from(listingReports)
    .where(eq(listingReports.status, "open"));
  return rows.length;
}
