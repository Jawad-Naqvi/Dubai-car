"use client";

import { listMarkets } from "@/lib/market";
import { useSelectMarket } from "@/components/market/market-provider";

/** Country cards on the selector page. Client-side so the switch does a full
 *  navigation (see useSelectMarket) and the market actually changes. */
export function MarketCards() {
  const markets = listMarkets();
  const selectMarket = useSelectMarket();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {markets.map((m) => (
        <button
          key={m.code}
          type="button"
          disabled={!m.enabled}
          onClick={() => selectMarket(m.code, "/buy")}
          className="group w-full rounded-2xl border border-[#E7E4DA] bg-white shadow-card hover:border-[#C8A93E] hover:shadow-card-hover transition-all p-5 flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-4xl leading-none">{m.flag}</span>
          <span className="text-sm font-semibold text-[#141414]">
            {m.shortName}
          </span>
          <span className="text-[10px] text-muted">
            {m.currency}
            {m.enabled ? "" : " · soon"}
          </span>
        </button>
      ))}
    </div>
  );
}
