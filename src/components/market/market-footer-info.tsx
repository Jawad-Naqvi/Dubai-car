"use client";

import { Fragment } from "react";
import { Mail } from "lucide-react";
import { useMarket } from "@/components/market/market-provider";

/**
 * Market-aware footer brand info (tagline, address, email). UAE keeps its
 * existing i18n tagline (passed in, so Arabic is preserved) and its address +
 * email are identical to before; other markets use their own from the registry.
 */
export function MarketFooterInfo({ uaeTagline }: { uaeTagline: string }) {
  const market = useMarket();
  const tagline = market.code === "AE" ? uaeTagline : market.tagline;

  return (
    <>
      <p className="mt-3 text-xs text-white/60 max-w-xs leading-relaxed">
        {tagline}
      </p>
      <p className="mt-5 text-xs text-white/60 leading-relaxed">
        {market.addressLines.map((line, i) => (
          <Fragment key={line}>
            {i > 0 && <br />}
            {line}
          </Fragment>
        ))}
      </p>
      <a
        href={`mailto:${market.email}`}
        className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors"
      >
        <Mail className="h-3 w-3" />
        {market.email}
      </a>
    </>
  );
}
