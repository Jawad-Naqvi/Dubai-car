import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { listingInspections } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import {
  deriveInspection,
  type InspectionReport,
  type InspectionCategory,
} from "@/lib/inspection";
import type { MockListing } from "@/lib/mock-data";
import { bust } from "./revalidate";

function summarize(
  categories: InspectionCategory[],
): Pick<InspectionReport, "points" | "passed" | "advisories" | "failed"> {
  const flat = categories.flatMap((c) => c.items);
  return {
    points: flat.length,
    passed: flat.filter((i) => i.status === "pass").length,
    advisories: flat.filter((i) => i.status === "advisory").length,
    failed: flat.filter((i) => i.status === "fail").length,
  };
}

/**
 * Inspection report for a listing.
 *  - A real dealer/admin-submitted row (DB) always wins.
 *  - Otherwise, if the listing is marked inspected, a deterministic report is
 *    derived so the "Inspection report available" badge is never empty.
 *  - Non-inspected listings return null (badge stays "on request").
 */
export async function getInspection(
  listing: MockListing,
): Promise<InspectionReport | null> {
  if (isDbEnabled()) {
    try {
      const [row] = await db
        .select()
        .from(listingInspections)
        .where(eq(listingInspections.listingId, listing.id))
        .limit(1);
      if (row) {
        return {
          inspectorName: row.inspectorName,
          inspectedAt: row.inspectedAt.toISOString(),
          categories: row.categories,
          ...summarize(row.categories),
          source: "dealer",
        };
      }
    } catch {
      // Table not migrated yet, or a transient DB error — fall through to the
      // derived report so the page still renders instead of 500-ing.
    }
  }

  if (!listing.isInspected) return null;
  return deriveInspection({
    id: listing.id,
    make: listing.make,
    model: listing.model,
    year: listing.year,
    kms: listing.kms,
    isNew: listing.isNew,
    emirate: listing.emirate,
  });
}

/** Upsert a dealer/admin-submitted inspection report for a listing. */
export async function saveInspection(
  listingId: string,
  input: { inspectorName: string; categories: InspectionCategory[] },
): Promise<{ ok: boolean; error?: string }> {
  if (!isDbEnabled()) return { ok: false, error: "Database not configured" };
  if (!input.inspectorName?.trim()) {
    return { ok: false, error: "Inspector name required" };
  }
  if (!Array.isArray(input.categories) || input.categories.length === 0) {
    return { ok: false, error: "At least one checked category required" };
  }
  await db
    .insert(listingInspections)
    .values({
      listingId,
      inspectorName: input.inspectorName.slice(0, 160),
      categories: input.categories,
      inspectedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: listingInspections.listingId,
      set: {
        inspectorName: input.inspectorName.slice(0, 160),
        categories: input.categories,
        inspectedAt: new Date(),
      },
    });
  bust("listings");
  return { ok: true };
}
