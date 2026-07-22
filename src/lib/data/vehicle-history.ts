import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { vehicleHistory } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import {
  deriveHistory,
  type VehicleHistoryReport,
  type TitleStatus,
  type ImportStatus,
} from "@/lib/vehicle-history";
import type { MockListing } from "@/lib/mock-data";
import { bust } from "./revalidate";

function importFromSpec(spec?: string): ImportStatus {
  if (!spec) return "unknown";
  const s = spec.toLowerCase();
  if (s.includes("gcc")) return "gcc";
  return "imported";
}

/**
 * Pluggable VIN-history provider. Returns null unless VIN_HISTORY_API_KEY is
 * configured (and, in future, a real integration is wired here). Kept as a
 * seam so a provider like a UAE VIN-check API can be added without touching
 * callers — a real report then takes priority over dealer/derived data.
 */
async function fetchProviderHistory(
  _vin: string,
): Promise<VehicleHistoryReport | null> {
  if (!process.env.VIN_HISTORY_API_KEY) return null;
  // TODO: integrate a real provider here and map its payload to
  // VehicleHistoryReport with source: "provider", complete: true.
  return null;
}

/**
 * Best available vehicle history for a listing.
 *  1. Real provider report (if VIN + provider configured)
 *  2. Dealer/admin-submitted report (DB)
 *  3. Derived facts from the listing (never fabricated)
 */
export async function getVehicleHistory(
  listing: MockListing,
): Promise<VehicleHistoryReport> {
  const vin = (listing as { vin?: string }).vin;

  if (vin) {
    const provider = await fetchProviderHistory(vin).catch(() => null);
    if (provider) return provider;
  }

  if (isDbEnabled()) {
    try {
      const [row] = await db
        .select()
        .from(vehicleHistory)
        .where(eq(vehicleHistory.listingId, listing.id))
        .limit(1);
      if (row) {
        return {
          source: (row.source as "provider" | "dealer") ?? "dealer",
          complete: true,
          titleStatus: (row.titleStatus as TitleStatus) ?? "unknown",
          owners: row.owners ?? null,
          accidentsReported: row.accidentsReported ?? null,
          accidents: row.accidents ?? [],
          serviceHistoryDeclared: (row.serviceRecords ?? []).length > 0,
          serviceRecords: row.serviceRecords ?? [],
          odometerConsistent: row.odometerConsistent ?? null,
          firstRegisteredYear: listing.year,
          registeredEmirate: listing.emirate,
          importStatus: importFromSpec(listing.regionalSpec),
          vin: row.vin ?? vin,
          reportedAt: row.reportedAt.toISOString(),
        };
      }
    } catch {
      // Table not migrated / transient error — fall through to derived.
    }
  }

  return deriveHistory({
    make: listing.make,
    model: listing.model,
    year: listing.year,
    kms: listing.kms,
    emirate: listing.emirate,
    regionalSpec: listing.regionalSpec,
    vin,
    features: listing.features,
  });
}

/** Upsert a dealer/admin-submitted vehicle history report for a listing. */
export async function saveVehicleHistory(
  listingId: string,
  input: {
    titleStatus?: TitleStatus;
    owners?: number;
    accidentsReported?: boolean;
    odometerConsistent?: boolean;
    accidents?: VehicleHistoryReport["accidents"];
    serviceRecords?: VehicleHistoryReport["serviceRecords"];
    vin?: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  if (!isDbEnabled()) return { ok: false, error: "Database not configured" };
  const values = {
    listingId,
    source: "dealer" as const,
    vin: input.vin?.slice(0, 32),
    titleStatus: input.titleStatus ?? "clean",
    owners: input.owners,
    accidentsReported: input.accidentsReported,
    odometerConsistent: input.odometerConsistent,
    accidents: input.accidents ?? [],
    serviceRecords: input.serviceRecords ?? [],
    reportedAt: new Date(),
  };
  await db
    .insert(vehicleHistory)
    .values(values)
    .onConflictDoUpdate({
      target: vehicleHistory.listingId,
      set: values,
    });
  bust("listings");
  return { ok: true };
}
