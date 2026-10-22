"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { listMarkets } from "@/lib/market";
import { useMarket, useSelectMarket } from "@/components/market/market-provider";
import { cn } from "@/lib/utils";

/**
 * Header country switcher. Shows the active market's flag and lets the user
 * switch inline (same cookie + redirect as the /select-country page). Reflects
 * the client-resolved market, so it matches whatever the prices show.
 */
export function MarketSwitcher({ className }: { className?: string }) {
  const market = useMarket();
  const selectMarket = useSelectMarket();
  const markets = listMarkets();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        suppressHydrationWarning
        aria-label="Change country"
        className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:text-[#141414] px-2 py-1.5 rounded-full transition-colors"
      >
        <span className="text-sm leading-none">{market.flag}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute end-0 mt-1 w-44 rounded-xl bg-white border border-[#E5E5EA] shadow-card p-1 z-50">
          <div className="px-2 py-1 text-[10px] uppercase tracking-widest text-muted">
            Country
          </div>
          {markets.map((m) => (
            <button
              key={m.code}
              type="button"
              disabled={!m.enabled}
              onClick={() => {
                setOpen(false);
                selectMarket(m.code);
              }}
              className="flex w-full items-center gap-2 px-2 py-2 rounded-lg text-xs text-[#141414] hover:bg-[#F4F4F6] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm leading-none">{m.flag}</span>
              <span className="flex-1 text-start">{m.shortName}</span>
              <span className="text-[10px] text-muted">{m.currency}</span>
              {m.code === market.code && (
                <Check className="h-3 w-3 text-[#137A43]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
