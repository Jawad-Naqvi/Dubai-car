import { TrendingDown, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

type Rating = "Great" | "Good" | "Fair";

const STYLES: Record<Rating, string> = {
  Great: "bg-[#137A43] text-white border-transparent",
  Good: "bg-[#E7F1EA] text-[#137A43] border-[#B7D8C3]",
  Fair: "bg-[#F3F1E9] text-[#6B6B6B] border-[#E0DCCF]",
};

/**
 * cars.com-style price signal. `rating` is computed vs peer-car prices
 * (see computeDealRating) — a real data signal, not a static label.
 */
export function DealBadge({
  rating,
  className,
  showIcon = true,
}: {
  rating?: Rating | null;
  className?: string;
  showIcon?: boolean;
}) {
  if (!rating) return null;
  return (
    <span
      title={`${rating} price vs similar cars`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none",
        STYLES[rating],
        className,
      )}
    >
      {showIcon && <TrendingDown className="h-2.5 w-2.5" />}
      {rating} Deal
    </span>
  );
}

/**
 * cars.com-style "High Demand" badge — a scarcity signal, distinct from
 * DealBadge's price-fairness rating. See lib/vehicle-derive.ts: isHighDemand.
 */
export function HighDemandBadge({
  show,
  className,
}: {
  show: boolean;
  className?: string;
}) {
  if (!show) return null;
  return (
    <span
      title="Many buyers are viewing or inquiring about this car"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none bg-[#FBEAD3] text-[#C97612] border-[#F0941F]/30",
        className,
      )}
    >
      <Flame className="h-2.5 w-2.5" />
      High Demand
    </span>
  );
}
