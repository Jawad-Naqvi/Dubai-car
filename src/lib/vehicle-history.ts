/**
 * Vehicle history report (Carfax-style), UAE-adapted.
 *
 * IMPORTANT: we never fabricate accident/ownership records. A report is built
 * from one of three sources, in priority order (see data/vehicle-history.ts):
 *   1. "provider" — a real VIN-history API (when VIN_HISTORY_API_KEY is set)
 *   2. "dealer"   — a report the dealer/admin submitted for this listing
 *   3. "derived"  — only the facts we actually know from the listing itself
 *                   (regional spec, registration emirate, model year, whether
 *                   the seller declared a service history). Everything unknown
 *                   is reported as "Not reported", not invented.
 */

export type TitleStatus = "clean" | "salvage" | "rebuilt" | "unknown";
export type ImportStatus = "gcc" | "imported" | "unknown";

export interface AccidentRecord {
  date: string;
  severity: "minor" | "moderate" | "major";
  note: string;
}

export interface ServiceRecord {
  date: string;
  km?: number;
  note: string;
}

export interface VehicleHistoryReport {
  source: "provider" | "dealer" | "derived";
  /** Records are known-complete (provider/dealer) vs partial (derived). */
  complete: boolean;
  titleStatus: TitleStatus;
  /** null = not reported. */
  owners: number | null;
  accidentsReported: boolean | null;
  accidents: AccidentRecord[];
  serviceHistoryDeclared: boolean;
  serviceRecords: ServiceRecord[];
  odometerConsistent: boolean | null;
  firstRegisteredYear?: number;
  registeredEmirate?: string;
  importStatus: ImportStatus;
  vin?: string;
  reportedAt: string;
}

export interface DerivableListing {
  make: string;
  model: string;
  year: number;
  kms: number;
  emirate?: string;
  regionalSpec?: string;
  vin?: string;
  features?: string[];
}

function importFromSpec(spec?: string): ImportStatus {
  if (!spec) return "unknown";
  const s = spec.toLowerCase();
  if (s.includes("gcc")) return "gcc";
  if (["american", "european", "japanese", "canadian", "import"].some((k) => s.includes(k)))
    return "imported";
  return "unknown";
}

/**
 * A derived report from ONLY the facts on the listing. No invented history —
 * unknowns are null/"unknown" so the UI can show "Not reported".
 */
export function deriveHistory(l: DerivableListing): VehicleHistoryReport {
  const serviceHistoryDeclared = (l.features ?? []).some((f) =>
    /service history|full history|dealer history|fsh/i.test(f),
  );
  return {
    source: "derived",
    complete: false,
    titleStatus: "unknown",
    owners: null,
    accidentsReported: null,
    accidents: [],
    serviceHistoryDeclared,
    serviceRecords: [],
    odometerConsistent: null,
    firstRegisteredYear: l.year,
    registeredEmirate: l.emirate,
    importStatus: importFromSpec(l.regionalSpec),
    vin: l.vin,
    reportedAt: new Date(0).toISOString(),
  };
}
