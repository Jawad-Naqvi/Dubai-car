/**
 * MARKET REGISTRY — the country packs the storefront can run as.
 *
 * This is the Kavak-style "select a country" model. Each market defines its own
 * currency, phone code, languages, location vocabulary and brand. UAE is the
 * launch market and the DEFAULT, so when nothing is chosen the whole site
 * behaves exactly as it does today — India is strictly additive on top.
 *
 * This module is isomorphic (no server-only imports) so client and server code
 * can both read market config. Resolving the *active* market from the request
 * lives in `market-active.ts` (server) and the cookie it reads is MARKET_COOKIE.
 */

export type MarketCode = "AE" | "IN";

export interface Market {
  code: MarketCode;
  /** Full country name, e.g. "United Arab Emirates". */
  name: string;
  /** Short label, e.g. "UAE". */
  shortName: string;
  /** Flag emoji for the selector. */
  flag: string;
  /** ISO currency code. */
  currency: string;
  /** Intl locale used for currency/number formatting (grouping rules differ). */
  numberLocale: string;
  /** International dial code. */
  dialCode: string;
  /** UI languages available in this market (first is the default). */
  locales: readonly string[];
  /** Brand name shown in this market. TODO(client): confirm India brand. */
  brandName: string;
  /** What a sub-region is called here (drives filter labels). */
  regionLabel: string;
  /** Whether the market is live. India can ship behind a flag first. */
  enabled: boolean;
}

export const MARKETS: Record<MarketCode, Market> = {
  AE: {
    code: "AE",
    name: "United Arab Emirates",
    shortName: "UAE",
    flag: "🇦🇪",
    currency: "AED",
    numberLocale: "en-AE",
    dialCode: "+971",
    locales: ["en", "ar"],
    brandName: "DXB Motors",
    regionLabel: "Emirate",
    enabled: true,
  },
  IN: {
    code: "IN",
    name: "India",
    shortName: "India",
    flag: "🇮🇳",
    currency: "INR",
    numberLocale: "en-IN",
    dialCode: "+91",
    locales: ["en", "hi"],
    // TODO(client decision): final India brand name. Placeholder for now.
    brandName: "Motors India",
    regionLabel: "State",
    enabled: true,
  },
};

/** UAE is the default so an unset market leaves the site exactly as it is. */
export const DEFAULT_MARKET: MarketCode = "AE";

/** Cookie the selector sets; `market-active.ts` reads it server-side. */
export const MARKET_COOKIE = "dxb_market";

export function isMarketCode(x: unknown): x is MarketCode {
  return x === "AE" || x === "IN";
}

/** Config for a code, falling back to the default market for anything unknown. */
export function getMarket(code: string | null | undefined): Market {
  return isMarketCode(code) ? MARKETS[code] : MARKETS[DEFAULT_MARKET];
}

/** All markets in selector order (enabled first, default first within that). */
export function listMarkets(): Market[] {
  return Object.values(MARKETS).sort(
    (a, b) =>
      Number(b.enabled) - Number(a.enabled) ||
      (a.code === DEFAULT_MARKET ? -1 : b.code === DEFAULT_MARKET ? 1 : 0),
  );
}

/**
 * Currency-aware money formatter. Existing UAE code keeps using `formatAED`;
 * this is what India (and any market-aware display) uses so the symbol and
 * grouping follow the market — e.g. ₹3,85,000 vs AED 385,000.
 */
export function formatMoney(
  value: number,
  market: Market,
  opts: { locale?: string } = {},
): string {
  const locale = opts.locale || market.numberLocale;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: market.currency,
    maximumFractionDigits: 0,
  }).format(value);
}
