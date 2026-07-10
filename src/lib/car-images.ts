/**
 * Car imagery provider chain.
 *
 * Priority:
 *  1. IMAGIN.studio CDN render (studio-quality, by make/model/year/angle) when
 *     NEXT_PUBLIC_IMAGIN_CUSTOMER_KEY is configured — https://www.imagin.studio/car-image-api
 *  2. The image URL stored on the record (dealer upload / catalog-synced URL,
 *     e.g. a Wikimedia Commons image resolved at sync time)
 *  3. Branded SVG placeholder (never a broken image)
 *
 * Used by the landing page, catalog pages, and anywhere a car must be shown
 * without a dealer-uploaded photo.
 */

const IMAGIN_BASE = "https://cdn.imagin.studio/getImage";

export interface CarImageParams {
  make: string;
  model: string;
  year?: number;
  /** imagin angle code: 01 front-three-quarter … 23 side, 29 rear */
  angle?: string;
  color?: string;
  /** existing stored URL (dealer upload or catalog sync result) */
  fallbackUrl?: string;
}

function slugify(v: string): string {
  return v.toLowerCase().trim().replace(/\s+/g, "-");
}

export function imaginKey(): string | undefined {
  return process.env.NEXT_PUBLIC_IMAGIN_CUSTOMER_KEY || undefined;
}

/** Build an IMAGIN.studio render URL. Returns undefined when no key is set. */
export function imaginUrl(p: CarImageParams): string | undefined {
  const key = imaginKey();
  if (!key) return undefined;
  const q = new URLSearchParams({
    customer: key,
    make: slugify(p.make),
    modelFamily: slugify(p.model),
    zoomType: "fullscreen",
    angle: p.angle ?? "23",
  });
  if (p.year) q.set("modelYear", String(p.year));
  if (p.color) q.set("paintDescription", p.color);
  return `${IMAGIN_BASE}?${q.toString()}`;
}

/** Inline SVG placeholder (data URI) so cards never render broken. */
export function placeholderCarImage(label = "DXB Motors"): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#F3F1E9"/><g fill="none" stroke="#D8D4C6" stroke-width="14" stroke-linecap="round"><path d="M170 380h460"/><path d="M210 380c10-60 50-110 120-120l140-6c70 6 110 46 140 126"/><circle cx="280" cy="392" r="36"/><circle cx="540" cy="392" r="36"/></g><text x="400" y="500" font-family="sans-serif" font-size="28" fill="#98958B" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Resolve the best available image URL for a car. */
export function carImageUrl(p: CarImageParams): string {
  return imaginUrl(p) ?? p.fallbackUrl ?? placeholderCarImage(`${p.make} ${p.model}`);
}
