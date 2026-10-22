import { emirates } from "./brand";
import { slugify } from "./utils";
import { DEFAULT_MARKET, isMarketCode, type MarketCode } from "./market";

/**
 * Per-market location vocabulary. The `listings.emirate` / `dealers.emirate`
 * column stores whichever region name applies to the car's market — Emirates
 * for the UAE, cities for India. This module is the single source for the
 * filter and sell-form dropdowns so each market shows its own places. UAE reuses
 * the existing `emirates` list verbatim, so nothing changes for UAE.
 */
export interface Region {
  id: string;
  en: string;
  ar?: string;
}

const AE_REGIONS: Region[] = emirates.map((e) => ({
  id: e.id,
  en: e.en,
  ar: e.ar,
}));

/** Major Indian car-market cities (how Indian buyers actually filter). */
const IN_REGIONS: Region[] = [
  "Mumbai",
  "Delhi NCR",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Chandigarh",
  "Kochi",
  "Surat",
].map((c) => ({ id: slugify(c), en: c }));

export const REGIONS: Record<MarketCode, Region[]> = {
  AE: AE_REGIONS,
  IN: IN_REGIONS,
};

export function getRegions(code: string | null | undefined): Region[] {
  return REGIONS[isMarketCode(code) ? code : DEFAULT_MARKET];
}
