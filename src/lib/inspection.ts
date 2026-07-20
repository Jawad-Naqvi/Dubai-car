/**
 * Vehicle inspection report — types + a deterministic derivation used in demo
 * mode (no DB) so every "inspected" listing shows a realistic, cars.com-style
 * multi-point report instead of an empty promise. In DB mode a dealer/admin
 * row overrides this (see lib/data/inspection.ts).
 *
 * Pure + isomorphic: no Date.now()/Math.random(), so the same listing always
 * yields the same report (stable across renders and SSR/CSR).
 */

export type CheckStatus = "pass" | "advisory" | "fail";

export interface InspectionItem {
  label: string;
  status: CheckStatus;
  note?: string;
}

export interface InspectionCategory {
  name: string;
  items: InspectionItem[];
}

export interface InspectionReport {
  inspectorName: string;
  inspectedAt: string; // ISO date
  /** Total checkpoints examined (headline: "N-point inspection"). */
  points: number;
  passed: number;
  advisories: number;
  failed: number;
  categories: InspectionCategory[];
  /** Where the report came from — a real dealer submission or a derived demo. */
  source: "dealer" | "derived";
}

/* ------------------------------------------------------------------ */
/* Deterministic seeded helpers (no Math.random)                       */
/* ------------------------------------------------------------------ */

/** FNV-1a hash → unsigned 32-bit int. */
function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic 0..1 from a seed string. */
function rand(seed: string): number {
  return hash(seed) / 0xffffffff;
}

/* ------------------------------------------------------------------ */
/* Checklist template                                                  */
/* ------------------------------------------------------------------ */

const TEMPLATE: { name: string; items: string[] }[] = [
  {
    name: "Engine & Transmission",
    items: [
      "Engine oil level & condition",
      "Coolant level & leaks",
      "Transmission shift quality",
      "Belts & hoses",
      "Battery health",
      "Exhaust & emissions",
      "Engine mounts",
    ],
  },
  {
    name: "Brakes & Suspension",
    items: [
      "Brake pads & discs",
      "Brake fluid",
      "Shock absorbers",
      "Steering play & alignment",
      "Wheel bearings",
      "Suspension bushings",
    ],
  },
  {
    name: "Tyres & Wheels",
    items: [
      "Front tyre tread depth",
      "Rear tyre tread depth",
      "Tyre age (DOT)",
      "Wheel & rim condition",
      "Spare tyre & tools",
    ],
  },
  {
    name: "Exterior & Body",
    items: [
      "Paint & panel condition",
      "Body panel gaps / repaint check",
      "Windscreen & glass",
      "Lights & indicators",
      "Chassis / accident inspection",
    ],
  },
  {
    name: "Interior & AC",
    items: [
      "Air-conditioning cooling",
      "Seats & upholstery",
      "Dashboard & warning lights",
      "Infotainment & speakers",
      "Windows & central locking",
    ],
  },
  {
    name: "Electrical & Road Test",
    items: [
      "Starter & alternator",
      "All sensors & cameras",
      "Test drive — acceleration",
      "Test drive — braking",
      "Test drive — noise/vibration",
    ],
  },
];

export interface DerivableListing {
  id: string;
  make: string;
  model: string;
  year: number;
  kms: number;
  isNew?: boolean;
  emirate?: string;
}

const ANCHOR_MS = Date.UTC(2026, 6, 1); // 2026-07-01, fixed so dates are stable
const INSPECTORS = [
  "AutoInspect Gulf",
  "CarChecked UAE",
  "Emirates Motor Inspection",
  "TrustCheck Dubai",
];

/**
 * Build a realistic report for a listing. Newer/lower-km cars pass clean; older,
 * higher-km cars accrue a few advisories (and rarely a minor fail) — but never
 * so many that an "inspected" car looks unsellable.
 */
export function deriveInspection(l: DerivableListing): InspectionReport {
  const age = Math.max(0, 2026 - l.year);
  // 0 (pristine) → ~1 (worn). Blend age and mileage.
  const wear = Math.min(1, age * 0.06 + (l.kms / 100_000) * 0.35);

  const categories: InspectionCategory[] = TEMPLATE.map((cat) => ({
    name: cat.name,
    items: cat.items.map((label) => {
      const r = rand(`${l.id}|${cat.name}|${label}`);
      // New cars: everything passes. Otherwise, higher wear lifts the chance of
      // an advisory; only badly worn cars ever get an occasional minor fail.
      let status: CheckStatus = "pass";
      if (!l.isNew) {
        if (r < wear * 0.28) status = "advisory";
        if (r < wear * 0.05 && wear > 0.6) status = "fail";
      }
      return {
        label,
        status,
        note: status === "advisory"
          ? ADVISORY_NOTES[Math.floor(rand(`${l.id}|${label}|n`) * ADVISORY_NOTES.length)]
          : status === "fail"
            ? "Recommend replacement before sale"
            : undefined,
      };
    }),
  }));

  const flat = categories.flatMap((c) => c.items);
  const passed = flat.filter((i) => i.status === "pass").length;
  const advisories = flat.filter((i) => i.status === "advisory").length;
  const failed = flat.filter((i) => i.status === "fail").length;

  const daysAgo = Math.floor(rand(l.id + "d") * 45) + 2;
  const inspectedAt = new Date(ANCHOR_MS - daysAgo * 86_400_000).toISOString();
  const inspectorName = INSPECTORS[hash(l.id) % INSPECTORS.length];

  return {
    inspectorName,
    inspectedAt,
    points: flat.length,
    passed,
    advisories,
    failed,
    categories,
    source: "derived",
  };
}

const ADVISORY_NOTES = [
  "Minor wear — monitor at next service",
  "Slightly below spec, still serviceable",
  "Light cosmetic wear noted",
  "Within tolerance, recommend future check",
];

/** Headline verdict from the report totals. */
export function inspectionVerdict(r: InspectionReport): {
  label: string;
  tone: "great" | "good" | "fair";
} {
  if (r.failed > 0) return { label: "Needs attention", tone: "fair" };
  if (r.advisories === 0) return { label: "Excellent condition", tone: "great" };
  if (r.advisories <= 3) return { label: "Very good condition", tone: "good" };
  return { label: "Good condition", tone: "fair" };
}
