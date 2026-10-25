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
  /** Lower-case plural of the region word, for "All …" dropdown options. */
  regionPlural: string;
  /** One-line marketing tagline (used for non-UAE markets; UAE keeps its i18n one). */
  tagline: string;
  /** Office address block, one line per entry. */
  addressLines: string[];
  /** Contact email shown in the footer. */
  email: string;
  /** Typical car-loan APR (decimal) for "est. monthly" figures on listings. */
  loanApr: number;
  /** Dealer plan monthly prices, in this market's currency, by tier id. */
  planPrices: Record<"free" | "silver" | "gold" | "platinum", number>;
  /** Performance add-on prices, in this market's currency. */
  addOnPrices: {
    featuredListing: number;
    homepageBannerWeekly: number;
    categorySponsorMonthly: number;
    exportVisibilityMonthly: number;
  };
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
    regionPlural: "emirates",
    tagline: "Dubai's yard-forward automotive marketplace. Buy, sell, export — one OS.",
    addressLines: ["Jebel Ali Free Zone", "Dubai, United Arab Emirates"],
    email: "hello@dxbmotors.ae",
    loanApr: 0.04,
    planPrices: { free: 0, silver: 299, gold: 699, platinum: 1499 },
    addOnPrices: {
      featuredListing: 49,
      homepageBannerWeekly: 500,
      categorySponsorMonthly: 800,
      exportVisibilityMonthly: 1000,
    },
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
    // English-first launch. Hindi ("hi") is a clean future addition: add the
    // locale to i18n routing + a translated messages/hi.json, then list it here.
    locales: ["en"],
    // TODO(client decision): final India brand name. Placeholder for now.
    brandName: "Motors India",
    regionLabel: "City",
    regionPlural: "cities",
    tagline: "India's trusted used-car marketplace. Buy, sell and finance — one platform.",
    // TODO(client): confirm India office address + contact email.
    addressLines: ["Bandra Kurla Complex", "Mumbai, India"],
    email: "hello@motorsindia.in",
    // TODO(client): confirm with India finance partners (bank car loans ~9–10%).
    loanApr: 0.095,
    // TODO(client): confirm India dealer plan + add-on pricing. Placeholders set
    // at India price points, not an FX conversion of the AED plans.
    planPrices: { free: 0, silver: 2999, gold: 6999, platinum: 14999 },
    addOnPrices: {
      featuredListing: 499,
      homepageBannerWeekly: 4999,
      categorySponsorMonthly: 7999,
      exportVisibilityMonthly: 9999,
    },
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
