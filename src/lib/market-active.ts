import "server-only";
import { cookies } from "next/headers";
import {
  DEFAULT_MARKET,
  MARKET_COOKIE,
  getMarket,
  isMarketCode,
  type Market,
  type MarketCode,
} from "./market";

/**
 * The market for the current request. Reads the selector cookie and falls back
 * to the default (UAE) when absent or invalid — so any request without an
 * explicit choice behaves exactly as the UAE-only site always has.
 */
export async function getActiveMarketCode(): Promise<MarketCode> {
  try {
    const store = await cookies();
    const raw = store.get(MARKET_COOKIE)?.value;
    return isMarketCode(raw) ? raw : DEFAULT_MARKET;
  } catch {
    // cookies() can throw outside a request scope (e.g. during static gen).
    return DEFAULT_MARKET;
  }
}

/** Full market config for the current request. */
export async function getActiveMarket(): Promise<Market> {
  return getMarket(await getActiveMarketCode());
}
