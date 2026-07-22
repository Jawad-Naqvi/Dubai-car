/**
 * External car-data providers for the auto-synced vehicle catalog.
 *
 * Zero-key backbone:
 *  - NHTSA vPIC — official US-government vehicle catalog. Free, no key, no
 *    hard rate limit. Manufacturers must register vehicles before sale, so
 *    new model years (e.g. 2026/2027) appear here as they enter the market.
 *  - Wikimedia Commons — free, keyless photo search for model imagery.
 *
 * Optional enrichment (set env keys to activate):
 *  - AUTO_DEV_API_KEY → VIN decode (decodeVin) for the sell wizard's
 *    per-listing "Decode from VIN" auto-fill. NOT used for catalog photos/specs
 *    — auto.dev's photo/spec products are VIN-keyed and/or paywalled beyond
 *    the free tier, so they don't fit a generic make/model/year catalog.
 *  - API_NINJAS_KEY   → full spec sheets (engine, drive, fuel economy…)
 *  - CARAPI_TOKEN/SECRET → trim-level data via carapi.app
 *  - NEXT_PUBLIC_IMAGIN_CUSTOMER_KEY → studio renders via cdn.imagin.studio
 */

const VPIC = "https://vpic.nhtsa.dot.gov/api/vehicles";
const COMMONS = "https://commons.wikimedia.org/w/api.php";

const FETCH_OPTS: RequestInit = {
  headers: { "User-Agent": "DXBMotors-CatalogSync/1.0 (marketplace catalog)" },
  // Next.js server fetch — avoid caching sync data
  cache: "no-store",
};

async function getJson<T>(url: string, timeoutMs = 20000): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { ...FETCH_OPTS, signal: ctrl.signal });
    clearTimeout(to);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function slugify(v: string): string {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ---------- vPIC ---------- */

interface VpicResponse<T> {
  Count: number;
  Results: T[];
}

export interface VpicModel {
  Make_ID: number;
  Make_Name: string;
  Model_ID: number;
  Model_Name: string;
}

/** vPIC contains heritage/chassis junk ("'34", `88" WB`, bare numbers) —
 *  filter anything that isn't a real consumer model name. */
export function isJunkModelName(name: string): boolean {
  const n = name.trim();
  if (n.length < 2) return true;
  if (n.startsWith("'")) return true; // '34, '40 heritage entries
  if (/^\d+$/.test(n)) return true; // bare numbers
  if (/"/.test(n) || /\bWB\b/i.test(n)) return true; // wheelbase chassis codes
  return false;
}

/** All models a make offers for a given model year (includes future years).
 *  Queried per vehicle type so motorcycles/buses don't pollute the catalog —
 *  passenger cars, SUVs/crossovers (MPV), and pickups (truck). */
export async function vpicModelsForMakeYear(
  make: string,
  year: number,
): Promise<VpicModel[]> {
  const types = ["passenger%20car", "multipurpose%20passenger%20vehicle%20(mpv)", "truck"];
  const seen = new Map<number, VpicModel>();
  for (const type of types) {
    const data = await getJson<VpicResponse<VpicModel>>(
      `${VPIC}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}/vehicletype/${type}?format=json`,
    );
    for (const m of data?.Results ?? []) {
      if (m.Model_ID && !seen.has(m.Model_ID)) seen.set(m.Model_ID, m);
    }
  }
  return [...seen.values()];
}

export interface VpicMake {
  Make_ID: number;
  Make_Name: string;
}

/** All passenger-car makes known to vPIC (thousands; filtered by callers). */
export async function vpicAllMakes(): Promise<VpicMake[]> {
  const data = await getJson<VpicResponse<VpicMake>>(
    `${VPIC}/GetMakesForVehicleType/car?format=json`,
  );
  return (
    (data?.Results as (VpicMake & { MakeId?: number; MakeName?: string })[] | undefined)?.map(
      (m) => ({
        Make_ID: m.Make_ID ?? m.MakeId ?? 0,
        Make_Name: m.Make_Name ?? m.MakeName ?? "",
      }),
    ) ?? []
  );
}

/* ---------- Wikimedia Commons imagery ---------- */

interface CommonsPage {
  title: string;
  imageinfo?: { thumburl?: string; url?: string }[];
}

/** Best-effort photo lookup for "<year> <make> <model>" on Wikimedia Commons. */
const NOT_EXTERIOR =
  /interior|dashboard|engine|seats?|trunk|badge|logo|steering|console|cockpit/i;
/** Commons happily thumbnails PDFs/vectors/scans as .jpg — exclude by the
 *  underlying file title, not just the thumbnail URL's extension. */
const NOT_PHOTO_FILE = /\.(pdf|svg|djvu|xcf|tiff?|ogv|webm)(\s|$)/i;

/** Escape a string for safe use inside a RegExp constructor. */
function reEscape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Wikimedia's free-text search does loose token/description matching, not
 * topical relevance — e.g. "Toyota Land Cruiser" can match a Bolivia
 * landscape photo whose caption mentions the vehicle used on that tour, not
 * a photo of the car itself. Requiring the model name to actually appear in
 * the matched file's title is a cheap, effective relevance guard.
 */
async function wikimediaSearch(term: string, mustContain: string): Promise<string | null> {
  const q = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: term,
    gsrnamespace: "6",
    gsrlimit: "5",
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: "1280",
    format: "json",
  });
  const data = await getJson<{ query?: { pages?: Record<string, CommonsPage> } }>(
    `${COMMONS}?${q.toString()}`,
  );
  const pages = Object.values(data?.query?.pages ?? {});
  const relevance = new RegExp(reEscape(mustContain), "i");
  for (const p of pages.sort((a, b) => ((a as { index?: number }).index ?? 0) - ((b as { index?: number }).index ?? 0))) {
    const title = p.title ?? "";
    if (!relevance.test(title)) continue;
    if (NOT_EXTERIOR.test(title) || NOT_PHOTO_FILE.test(title)) continue;
    const info = p.imageinfo?.[0];
    const url = info?.thumburl ?? info?.url;
    if (url && /\.(jpe?g|png|webp)/i.test(url) && !NOT_EXTERIOR.test(url)) return url;
  }
  return null;
}

/**
 * Best-effort photo lookup for "<year> <make> <model>" on Wikimedia Commons.
 * Falls back to a year-less search when the qualified search finds nothing —
 * common for the current/next model year (e.g. vPIC reports next year's
 * models before any photos of them exist), where a photo of an adjacent
 * model year is a reasonable stand-in for a generic catalog thumbnail.
 */
export async function wikimediaImage(
  make: string,
  model: string,
  year?: number,
): Promise<string | null> {
  // Model name is the strongest relevance signal — makes are too generic
  // (many unrelated files mention "Toyota") but "Land Cruiser" reliably
  // narrows to the actual car.
  if (year) {
    const withYear = await wikimediaSearch(`${year} ${make} ${model}`, model);
    if (withYear) return withYear;
  }
  return wikimediaSearch(`${make} ${model}`, model);
}

/* ---------- Auto.dev VIN decode (optional; Starter/free tier) ---------- */

const AUTODEV_BASE = "https://api.auto.dev";

export function autodevKey(): string | undefined {
  return process.env.AUTO_DEV_API_KEY || undefined;
}

async function autodevJson<T>(path: string): Promise<T | null> {
  const key = autodevKey();
  if (!key) return null;
  const sep = path.includes("?") ? "&" : "?";
  try {
    const res = await fetch(`${AUTODEV_BASE}${path}${sep}apikey=${key}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * auto.dev's per-vehicle photo (`/photos/{vin}`) and spec (`/specs/{vin}`)
 * products are VIN-keyed, not make/model/year — they return real photos of
 * one specific indexed vehicle (often empty), and specs require auto.dev's
 * paid Growth plan ($299/mo; a Starter/free key gets 402 Payment Required).
 * Neither fits a generic "one representative photo/spec per model" catalog
 * (vPIC only ever gives us make/model/year, never a VIN), so this file does
 * not wire them into catalog sync — see decodeVin() below for the one
 * genuinely-working, free-tier use of this key: per-listing VIN lookup in
 * the sell wizard.
 */

export interface VinDecodeResult {
  vin: string;
  valid: boolean;
  make?: string;
  model?: string;
  /** Best-effort single year picked from the decoded range — an auto-fill
   *  convenience, not authoritative; the seller can always correct it. */
  year?: number;
  type?: string;
}

/**
 * Decode a VIN via auto.dev — identity/spec data only (make, model, year
 * range, vehicle type). Does NOT return accident/title/ownership history;
 * that's a different product category (see lib/data/vehicle-history.ts's
 * `fetchProviderHistory` seam for a real history provider).
 */
export async function decodeVin(vin: string): Promise<VinDecodeResult | null> {
  const clean = vin.trim().toUpperCase();
  if (clean.length < 11 || clean.length > 17) return null;
  const data = await autodevJson<{
    vin: string;
    vinValid?: boolean;
    make?: string;
    model?: string;
    years?: number[];
    type?: string;
  }>(`/vin/${encodeURIComponent(clean)}`);
  if (!data) return null;
  return {
    vin: data.vin ?? clean,
    valid: data.vinValid ?? true,
    make: data.make,
    model: data.model,
    year: data.years?.[0],
    type: data.type,
  };
}

/* ---------- API Ninjas spec enrichment (optional) ---------- */

export interface CarSpecs {
  class?: string;
  cylinders?: number;
  displacement?: number;
  drive?: string;
  fuel_type?: string;
  transmission?: string;
  city_mpg?: number;
  highway_mpg?: number;
  combination_mpg?: number;
  [key: string]: unknown;
}

export async function apiNinjasSpecs(
  make: string,
  model: string,
  year?: number,
): Promise<CarSpecs | null> {
  const key = process.env.API_NINJAS_KEY;
  if (!key) return null;
  const q = new URLSearchParams({ make, model });
  if (year) q.set("year", String(year));
  try {
    const res = await fetch(`https://api.api-ninjas.com/v1/cars?${q.toString()}`, {
      headers: { "X-Api-Key": key },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const arr = (await res.json()) as CarSpecs[];
    return arr?.[0] ?? null;
  } catch {
    return null;
  }
}

/* ---------- CarAPI trim enrichment (optional) ---------- */

let carapiJwt: { token: string; exp: number } | null = null;

async function carapiAuth(): Promise<string | null> {
  const token = process.env.CARAPI_TOKEN;
  const secret = process.env.CARAPI_SECRET;
  if (!token || !secret) return null;
  if (carapiJwt && carapiJwt.exp > Date.now() + 60000) return carapiJwt.token;
  try {
    const res = await fetch("https://carapi.app/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_token: token, api_secret: secret }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const jwt = await res.text();
    carapiJwt = { token: jwt, exp: Date.now() + 6 * 60 * 60 * 1000 };
    return jwt;
  } catch {
    return null;
  }
}

export interface CarApiTrim {
  name: string;
  description?: string;
  msrp?: number;
  year?: number;
  [key: string]: unknown;
}

export async function carapiTrims(
  make: string,
  model: string,
  year: number,
): Promise<CarApiTrim[]> {
  const jwt = await carapiAuth();
  if (!jwt) return [];
  const q = new URLSearchParams({ make, model, year: String(year) });
  try {
    const res = await fetch(`https://carapi.app/api/trims?${q.toString()}`, {
      headers: { Authorization: `Bearer ${jwt}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: CarApiTrim[] };
    return data.data ?? [];
  } catch {
    return [];
  }
}
