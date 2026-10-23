"use client";

import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import {
  formatMoney,
  getMarket,
  isMarketCode,
  DEFAULT_MARKET,
  MARKETS,
  MARKET_COOKIE,
  type Market,
  type MarketCode,
} from "@/lib/market";

const MarketContext = createContext<Market>(MARKETS[DEFAULT_MARKET]);

function readMarketCookie(): MarketCode | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${MARKET_COOKIE}=([^;]*)`),
  );
  const v = m ? decodeURIComponent(m[1]) : null;
  return isMarketCode(v) ? v : null;
}

/**
 * Provides the active market to client components. The server passes its best
 * guess (`code`) for the initial render; because the locale layout is statically
 * rendered, that guess is the default market. After mount we read the actual
 * market cookie on the client and correct it — so UAE (no cookie) never changes
 * and India flips to INR without forcing the whole app into dynamic rendering.
 * Using an effect keeps the first client render identical to the server's, so
 * there is no hydration mismatch.
 */
export function MarketProvider({
  code,
  fixed = false,
  children,
}: {
  code: string;
  /** When true, pin to `code` and ignore the cookie (used to force a subtree,
   *  e.g. a listing detail page, into that listing's own market). */
  fixed?: boolean;
  children: React.ReactNode;
}) {
  const [market, setMarket] = useState<Market>(() => getMarket(code));

  useEffect(() => {
    if (fixed) return;
    const cookie = readMarketCookie();
    if (cookie && cookie !== market.code) setMarket(getMarket(cookie));
  }, [market.code, fixed]);

  return (
    <MarketContext.Provider value={fixed ? getMarket(code) : market}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket(): Market {
  return useContext(MarketContext);
}

/**
 * Switch markets: write the cookie and do a FULL navigation so the whole tree
 * (layout + provider + server-scoped data) re-resolves to the new market. A
 * soft client navigation would not remount the provider, so the market would
 * appear not to change — which is exactly the bug this avoids.
 */
export function useSelectMarket() {
  const locale = useLocale();
  return useCallback(
    (code: MarketCode, to?: string) => {
      const market = getMarket(code);
      document.cookie = `${MARKET_COOKIE}=${market.code}; path=/; max-age=${
        60 * 60 * 24 * 365
      }; samesite=lax`;
      const lang = market.locales.includes(locale) ? locale : market.locales[0];
      // Default: stay on the current page (swap the /<locale> prefix) so the
      // user immediately sees the new market in context. `to` overrides it.
      const rest =
        to ?? window.location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");
      const dest = `/${lang}${rest === "/" ? "" : rest}`;
      // Hard navigation (not the Next router) so the cookie is re-read.
      window.location.assign(dest || `/${lang}`);
    },
    [locale],
  );
}

/**
 * Money formatter bound to the active market. For UAE this returns the same
 * string as formatAED; for India it returns INR (₹) with Indian grouping.
 */
export function useMoney() {
  const market = useMarket();
  return useCallback(
    (value: number, locale?: string) => formatMoney(value, market, { locale }),
    [market],
  );
}
