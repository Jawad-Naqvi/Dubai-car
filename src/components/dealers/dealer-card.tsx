import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./star-rating";
import type { DealerView } from "@/lib/data/dealers";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  MapPin,
  Car as CarIcon,
  ChevronRight,
} from "lucide-react";

/**
 * Dealer result card — flat bordered card (cars.com card language):
 * identity + trust signals, then a single black pill CTA.
 */
export function DealerCard({
  dealer,
  className,
}: {
  dealer: DealerView;
  className?: string;
}) {
  return (
    <Link
      href={`/dealers/${dealer.slug}`}
      className={cn(
        "group flex flex-col rounded-lg bg-white border border-[#E5E5EA] p-5 transition-colors hover:border-[#B9B9C4]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="h-14 w-14 rounded-md bg-[#370B55] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {dealer.name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-bold text-[15px] text-[#141414] leading-snug">
              {dealer.name}
            </h3>
            {dealer.isVerified && (
              <BadgeCheck className="h-4 w-4 text-[#8136B2] flex-shrink-0" />
            )}
            {dealer.isFeatured && <Badge tone="featured">Featured</Badge>}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-[#141414]">
              {Number(dealer.rating).toFixed(1)}
            </span>
            <StarRating value={dealer.rating} size="h-3 w-3" />
            <span className="text-[#63666A]">
              ({dealer.reviewCount.toLocaleString()})
            </span>
          </div>
        </div>
      </div>

      {dealer.tagline && (
        <p className="mt-3 text-xs text-[#63666A] line-clamp-2 leading-relaxed">
          {dealer.tagline}
        </p>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-[#63666A]">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {dealer.emirate}
        </span>
        <span className="inline-flex items-center gap-1">
          <CarIcon className="h-3 w-3" />
          {dealer.listingCount.toLocaleString()} car
          {dealer.listingCount === 1 ? "" : "s"} in stock
        </span>
      </div>

      <span className="mt-4 inline-flex items-center justify-center gap-1 h-9 px-4 rounded-full bg-[#141414] text-white text-xs font-semibold transition-colors group-hover:bg-[#2E2C28]">
        View inventory
        <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
