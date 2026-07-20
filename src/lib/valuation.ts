/**
 * Rule-based UAE used-car valuation model. Pure + isomorphic so the page can
 * show an instant estimate and the API can persist the same numbers. When a DB
 * is connected the API additionally blends in live market comps (see
 * lib/data/valuation.ts).
 */

export const BASE_BY_MAKE: Record<string, number> = {
  Toyota: 280000,
  Nissan: 220000,
  "Mercedes-Benz": 450000,
  BMW: 320000,
  Lexus: 380000,
  "Land Rover": 480000,
  Porsche: 620000,
  Audi: 280000,
  Ford: 140000,
  Chevrolet: 130000,
  Honda: 90000,
  Hyundai: 75000,
  Mitsubishi: 80000,
  Mazda: 80000,
};

/**
 * Per-model multiplier applied to the make base (1.0 = a "typical" model for
 * that make). Fixes the make-only bug where a Toyota Yaris and Land Cruiser got
 * the same estimate. Explicit entries win; otherwise a keyword tier is used.
 */
const MODEL_FACTOR: Record<string, number> = {
  // flagships / large SUVs
  "land cruiser": 1.0, "land cruiser 70": 0.9, prado: 0.7, patrol: 0.95,
  "range rover": 1.15, "g-class": 1.9, "g 63": 2.0, lx: 1.1, gx: 0.8,
  escalade: 1.0, tahoe: 0.75, "grand wagoneer": 1.0, sequoia: 0.8,
  // premium sedans / sports
  "s-class": 1.3, "7 series": 1.2, "8 series": 1.4, panamera: 1.3,
  "911": 1.6, "a8": 1.2, ls: 1.1, m5: 1.4, m4: 1.2, amg: 1.5, supra: 1.1,
  // mid
  camry: 0.5, accord: 0.55, "e-class": 0.75, "5 series": 0.7, "3 series": 0.55,
  a4: 0.55, a6: 0.7, "c-class": 0.6, sonata: 0.7, altima: 0.6, mustang: 0.7,
  // economy / compact
  yaris: 0.2, corolla: 0.3, "yaris cross": 0.25, rio: 0.35, picanto: 0.3,
  i10: 0.3, i20: 0.35, spark: 0.3, aveo: 0.35, sunny: 0.35, accent: 0.4,
  swift: 0.35, elantra: 0.45, civic: 0.5, jazz: 0.4, fit: 0.4, city: 0.4,
};

const FLAGSHIP_RE = /cruiser|patrol|range rover|escalade|navigator|g-?class|maybach|phantom|cullinan|wagoneer|expedition|armada|lx |gls|q7|q8|x7/i;
const ECONOMY_RE = /yaris|corolla|rio|picanto|spark|aveo|i10|i20|sunny|accent|swift|micra|celerio|attrage|figo|polo/i;

/** Model multiplier: explicit map → keyword tier → neutral 1.0. */
export function modelFactor(model: string): number {
  const key = model.trim().toLowerCase();
  if (key in MODEL_FACTOR) return MODEL_FACTOR[key];
  if (FLAGSHIP_RE.test(key)) return 1.0;
  if (ECONOMY_RE.test(key)) return 0.3;
  return 0.55; // a typical non-flagship model sits below the make's flagship base
}

export interface ValuationInput {
  make: string;
  model: string;
  year: number;
  kms: number;
  condition: string;
}

export interface ValuationResult {
  estimate: number;
  low: number;
  high: number;
  base: number;
  yearFactor: number;
  kmsFactor: number;
  conditionFactor: number;
  comps?: number; // count of market comparables used (DB mode)
}

const CURRENT_YEAR = 2026;

export function estimateValue(
  input: ValuationInput,
  marketBase?: number,
): ValuationResult {
  // marketBase (live comps, DB mode) already reflects the exact model, so only
  // apply the model factor to the make-level fallback base.
  const base = marketBase ?? (BASE_BY_MAKE[input.make] ?? 150000) * modelFactor(input.model);
  const yearFactor = Math.max(0.4, 1 - (CURRENT_YEAR - input.year) * 0.08);
  const kmsFactor = Math.max(0.5, 1 - (input.kms / 100000) * 0.25);
  const conditionFactor =
    input.condition === "New"
      ? 1.15
      : input.condition === "Certified Pre-Owned"
        ? 1.05
        : 1;
  const estimate = Math.round(base * yearFactor * kmsFactor * conditionFactor);
  return {
    estimate,
    low: Math.round(estimate * 0.92),
    high: Math.round(estimate * 1.08),
    base,
    yearFactor,
    kmsFactor,
    conditionFactor,
  };
}
