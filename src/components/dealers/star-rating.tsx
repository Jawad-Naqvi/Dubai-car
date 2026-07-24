import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Presentational 5-star row with fractional fill (e.g. 4.7 → 4.7/5 filled).
 * Server-safe — no interactivity; use ReviewsSection's picker for input.
 */
export function StarRating({
  value,
  size = "h-3.5 w-3.5",
  className,
}: {
  value: number;
  size?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (Number(value) / 5) * 100));
  return (
    <span
      className={cn("relative inline-block leading-none align-middle", className)}
      role="img"
      aria-label={`Rated ${Number(value).toFixed(1)} out of 5`}
    >
      <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={cn(size, "text-[#D9D9E0]")} />
        ))}
      </span>
      <span
        className="absolute inset-0 flex gap-0.5 overflow-hidden"
        style={{ width: `${pct}%` }}
        aria-hidden
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={cn(size, "flex-shrink-0 fill-[#8136B2] text-[#8136B2]")}
          />
        ))}
      </span>
    </span>
  );
}
