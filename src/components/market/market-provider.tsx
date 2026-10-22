"use client";

import { createContext, useContext, useCallback } from "react";
import {
  formatMoney,
  getMarket,
  DEFAULT_MARKET,
  MARKETS,
  type Market,
  type MarketCode,
} from "@/lib/market";

const MarketContext = createContext<Market>(MARKETS[DEFAULT_MARKET]);

/**
 * Makes the active market available to client components. Fed from the server
 * layout, which resolves the market cookie. Defaults to UAE, so a tree with no
 * provider (or the UAE market) formats money exactly as before.
 */
export function MarketProvider({
  code,
  children,
}: {
  code: MarketCode;
  children: React.ReactNode;
}) {
  return (
    <MarketContext.Provider value={getMarket(code)}>
      {children}
    </MarketContext.Provider>
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
