"use client";

import { createContext, useContext, useCallback, useEffect, useState } from "react";
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
  children,
}: {
  code: MarketCode;
  children: React.ReactNode;
}) {
  const [market, setMarket] = useState<Market>(() => getMarket(code));

  useEffect(() => {
    const cookie = readMarketCookie();
    if (cookie && cookie !== market.code) setMarket(getMarket(cookie));
  }, [market.code]);

  return (
    <MarketContext.Provider value={market}>{children}</MarketContext.Provider>
  );
}

export function useMarket(): Market {
  return useContext(MarketContext);
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
