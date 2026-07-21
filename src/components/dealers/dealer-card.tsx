import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "./star-rating";
import type { DealerView } from "@/lib/data/dealers";
import { cn } from "@/lib/utils";
import { BadgeCheck, MapPin, Car as CarIcon } from "lucide-react";

/**
 * Marketplace dealer card (OLX/grid style): a cover banner with the dealer
 * logo, identity + trust signals, stock/location chips, and a full-width CTA.
 * Compact and consistent height so a directory grid reads as a real
 * marketplace rather than sparse full-width rows.
 */
export function DealerCard({
  dealer,
  className,
}: {
  dealer: DealerView;
  className?: string;
}) {
  const hasCover = !!dealer.coverUrl;
  const hasLogo = !!dealer.logoUrl;

  return (
    <Link
      href={`/dealers/${dealer.slug}`}
      className={cn(
        "group flex flex-col rounded-2xl bg-white border border-[#E7E4DA] shadow-card overflow-hidden transition-all hover:shadow-card-hover hover:border-[#D8D4C6] hover:-translate-y-0.5",
        className,
      )}
    >
      {/* Cover banner */}
      <div className="relative h-20 bg-gradient-to-br from-[#181C30] via-[#20233a] to-[#2E2C28]">
        {hasCover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dealer.coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          {dealer.isFeatured && <Badge tone="featured">Featured</Badge>}
        </div>
        {/* Logo, overlapping the banner bottom-left */}
        <div className="absolute -bottom-6 left-4 h-12 w-12 rounded-xl bg-white ring-2 ring-white shadow-card flex items-center justify-center overflow-hidden">
          {hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dealer.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="h-full w-full bg-[#181C30] text-white font-bold text-base flex items-center justify-center">
              {dealer.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="pt-8 px-4 pb-4 flex-1 flex flex-col">
        <div className="flex items-start gap-1.5">
          <h3 className="font-bold text-sm text-[#141414] leading-snug line-clamp-1 flex-1">
            {dealer.name}
          </h3>
          {dealer.isVerified && (
            <BadgeCheck className="h-4 w-4 text-[#F0941F] flex-shrink-0 mt-0.5" />
          )}
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-[11px]">
          <StarRating value={dealer.rating} size="h-3 w-3" />
          <span className="font-semibold text-[#141414]">
            {Number(dealer.rating).toFixed(1)}
          </span>
          <span className="text-muted">
            ({dealer.reviewCount.toLocaleString()})
          </span>
        </div>

        {dealer.tagline && (
          <p className="mt-1.5 text-[11px] text-secondary line-clamp-1">
            {dealer.tagline}
          </p>
        )}

        {/* Chips row */}
        <div className="mt-3 pt-3 border-t border-[#F1EFE9] flex items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F1E9] px-2 py-1 text-secondary">
            <MapPin className="h-3 w-3 text-muted" />
            {dealer.emirate}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F1E9] px-2 py-1 font-semibold text-[#141414]">
            <CarIcon className="h-3 w-3 text-[#F0941F]" />
            {dealer.listingCount.toLocaleString()} in stock
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <span className="flex items-center justify-center h-9 w-full rounded-xl bg-[#141414] text-white text-xs font-semibold transition-colors group-hover:bg-[#2E2C28]">
          View inventory
        </span>
      </div>
    </Link>
  );
}
