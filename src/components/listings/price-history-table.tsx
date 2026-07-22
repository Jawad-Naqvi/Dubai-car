import { History, TrendingDown, TrendingUp } from "lucide-react";
import { formatAED } from "@/lib/utils";
import type { PricePoint } from "@/lib/data/price";

/**
 * cars.com-style price-history table — "listing date + price over time".
 * Pure UI on top of the existing price_history table (lib/data/price.ts);
 * renders nothing when a listing has never had a price change.
 */
export function PriceHistoryTable({
  points,
  locale = "en",
}: {
  points: PricePoint[];
  locale?: "en" | "ar";
}) {
  if (points.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-[#F0941F]" />
        <h2 className="text-sm font-bold">Price history</h2>
      </div>
      <div className="divide-y divide-[#F1EFE9]">
        {points.map((p, i) => {
          const dropped = p.newPrice < p.oldPrice;
          return (
            <div key={i} className="flex items-center justify-between gap-3 py-2">
              <span className="text-[11px] text-muted">
                {new Date(p.changedAt).toLocaleDateString(locale === "ar" ? "ar-AE" : "en-AE", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <span className="text-muted line-through">
                  {formatAED(p.oldPrice, locale)}
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 font-semibold ${
                    dropped ? "text-[#137A43]" : "text-[#B4540A]"
                  }`}
                >
                  {dropped ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <TrendingUp className="h-3 w-3" />
                  )}
                  {formatAED(p.newPrice, locale)}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
