import type { ListingSearchParams, SortKey } from "./listings";

type RawParams = Record<string, string | string[] | undefined>;

const SORTS: SortKey[] = [
  "newest",
  "price_asc",
  "price_desc",
  "year_desc",
  "kms_asc",
];

function multi(v: string | string[] | undefined): string[] | undefined {
  if (v == null) return undefined;
  const arr = Array.isArray(v) ? v : v.split(",");
  const cleaned = arr.map((s) => s.trim()).filter(Boolean);
  return cleaned.length ? cleaned : undefined;
}

function multiNum(v: string | string[] | undefined): number[] | undefined {
  const arr = multi(v);
  if (!arr) return undefined;
  const nums = arr.map(Number).filter((n) => Number.isFinite(n));
  return nums.length ? nums : undefined;
}

function num(v: string | string[] | undefined): number | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  if (s == null || s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function bool(v: string | string[] | undefined): boolean | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s === "true" || s === "1" ? true : undefined;
}

function str(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : undefined;
}

/** Parse Next.js searchParams (or a plain object) into typed query params. */
export function parseListingParams(raw: RawParams): ListingSearchParams {
  const sortRaw = str(raw.sort) as SortKey | undefined;
  return {
    q: str(raw.q),
    make: multi(raw.make),
    model: multi(raw.model),
    trim: multi(raw.trim),
    bodyType: multi(raw.bodyType),
    fuel: multi(raw.fuel),
    transmission: multi(raw.transmission),
    drivetrain: multi(raw.drivetrain),
    dealRating: multi(raw.dealRating),
    regionalSpec: multi(raw.regionalSpec),
    emirate: multi(raw.emirate),
    condition: multi(raw.condition),
    color: multi(raw.color),
    interiorColor: multi(raw.interiorColor),
    cylinders: multiNum(raw.cylinders),
    doors: multiNum(raw.doors),
    sellerType: str(raw.sellerType),
    priceMin: num(raw.priceMin),
    priceMax: num(raw.priceMax),
    yearMin: num(raw.yearMin),
    yearMax: num(raw.yearMax),
    kmsMax: num(raw.kmsMax),
    exportReady: bool(raw.exportReady),
    inspected: bool(raw.inspected),
    withPhotos: bool(raw.withPhotos),
    featured: bool(raw.featured),
    dealerSlug: str(raw.dealerSlug),
    sort: sortRaw && SORTS.includes(sortRaw) ? sortRaw : undefined,
    page: num(raw.page),
  };
}

/** Parse a URLSearchParams (used in the API route). */
export function parseFromURL(sp: URLSearchParams): ListingSearchParams {
  const raw: RawParams = {};
  for (const key of new Set(sp.keys())) {
    const all = sp.getAll(key);
    raw[key] = all.length > 1 ? all : all[0];
  }
  return parseListingParams(raw);
}
