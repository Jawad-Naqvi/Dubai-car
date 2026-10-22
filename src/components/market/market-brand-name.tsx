"use client";

import { useMarket } from "@/components/market/market-provider";

/**
 * The active market's brand name. For UAE this is "DXB Motors" (identical to
 * brand.name); for India it's the India brand. A tiny client leaf so it works
 * inside server components (like the footer) and tracks the client-resolved
 * market the same way prices do.
 */
export function MarketBrandName() {
  return <>{useMarket().brandName}</>;
}
