import { formatAED } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Rating = "Great" | "Good" | "Fair";

const RATING_WORD: Record<Rating, { word: string; color: string }> = {
  Great: { word: "great deal", color: "text-[#137A43]" },
  Good: { word: "good deal", color: "text-[#137A43]" },
  Fair: { word: "fair price", color: "text-[#B7791F]" },
};

/**
 * "This vehicle is a good deal" card: positions the asking price on the range
 * of peer-car prices (min/max of similar listings). Rendered only when we have
 * a computed deal rating and at least two peers to anchor the range.
 */
export function PriceContextMeter({
  price,
  peerPrices,
  rating,
  locale = "en",
}: {
  price: number;
  peerPrices: number[];
  rating?: Rating | null;
  locale?: "en" | "ar";
}) {
  if (!rating || peerPrices.length < 2) return null;

  const all = [...peerPrices, price];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = Math.max(1, max - min);
  const pct = Math.round(((price - min) / span) * 100);
  const { word, color } = RATING_WORD[rating];

  return (
    <div className="rounded-lg bg-white border border-[#E5E5EA] p-5">
      <h2 className="text-lg font-bold tracking-tight text-[#141414]">
        This vehicle is a <span className={color}>{word}</span>
      </h2>
      <p className="mt-1 text-xs text-[#63666A]">
        Compared with {peerPrices.length} similar cars currently for sale.
      </p>

      <div className="mt-5 mb-1 relative">
        {/* Price flag above the marker */}
        <div
          className="absolute -top-6 -translate-x-1/2 text-xs font-bold text-[#141414] whitespace-nowrap"
          style={{ left: `${pct}%` }}
        >
          {formatAED(price, locale)}
        </div>

        {/* Range track: green (below-market) fading to orange (above-market) */}
        <div className="h-1.5 rounded-full bg-gradient-to-r from-[#137A43] via-[#B7D8C3] to-[#F0B45E]" />

        {/* Marker */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full border-2 border-white shadow",
            rating === "Fair" ? "bg-[#B7791F]" : "bg-[#137A43]",
          )}
          style={{ left: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-[#63666A]">
        <span>{formatAED(min, locale)}</span>
        <span>{formatAED(max, locale)}</span>
      </div>
    </div>
  );
}
