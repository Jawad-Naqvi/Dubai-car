"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MARKET_COOKIE, getMarket } from "@/lib/market";

/**
 * Persist the chosen market in a cookie and route into it. Bound with the
 * current locale + the target market code at render time. Falls back to the
 * market's first supported language when the current locale isn't offered there
 * (e.g. choosing India while on `/ar`).
 */
export async function selectMarket(locale: string, code: string): Promise<void> {
  const market = getMarket(code);
  const store = await cookies();
  store.set(MARKET_COOKIE, market.code, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  const lang = market.locales.includes(locale) ? locale : market.locales[0];
  redirect(`/${lang}`);
}
