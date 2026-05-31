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
  const base = marketBase ?? BASE_BY_MAKE[input.make] ?? 150000;
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
