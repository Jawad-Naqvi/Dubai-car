import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatAED, monthlyEMI } from "@/lib/utils";
import { MapPin, BadgeCheck } from "lucide-react";
import type { MockListing } from "@/lib/mock-data";
import { SaveButton } from "./save-button";
import { CompareButton } from "./compare-button";
import { DealBadge, HighDemandBadge } from "./deal-badge";
import { isHighDemand } from "@/lib/vehicle-derive";

/**
 * Horizontal search-result card (cars.com SRP anatomy): photo left, then
 * condition / title / mileage / price / deal signal / seller, with a single
 * violet CTA bottom-right. Grid-style ListingCard stays for carousels and
 * storefront grids; this row layout is for the /buy results list.
 */
export function ListingRow({
  listing,
  locale = "en",
}: {
  listing: MockListing;
  locale?: "en" | "ar";
}) {
  const href = `/listings/${listing.id}/${listing.slug}`;
  return (
    <div className="group relative flex flex-col sm:flex-row rounded-lg bg-white border border-[#E5E5EA] overflow-hidden hover:border-[#B9B9C4] transition-colors">
      {/* Photo */}
      <Link
        href={href}
        className="relative block sm:w-[300px] lg:w-[340px] flex-shrink-0 aspect-[4/3] sm:aspect-auto sm:min-h-[210px] bg-[#F4F4F6] overflow-hidden"
      >
        <Image
          src={listing.imageUrl}
          alt={`${listing.year} ${listing.make} ${listing.model}`}
          fill
          sizes="(max-width: 640px) 100vw, 340px"
          className="object-cover"
        />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {listing.isFeatured && <Badge tone="featured">Featured</Badge>}
          {listing.status === "reserved" && <Badge tone="reserved">Reserved</Badge>}
        </div>
      </Link>

      {/* Save / compare */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5">
        <SaveButton listingId={listing.id} className="h-7 w-7" />
        <CompareButton listingId={listing.id} />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 p-4 flex flex-col">
        <div className="text-[11px] text-[#63666A]">
          {listing.isNew ? "New" : "Used"}
        </div>
        <Link href={href} className="block mt-0.5">
          <h3 className="text-[15px] font-semibold tracking-tight leading-snug text-[#141414] hover:underline underline-offset-2">
            {listing.year} {listing.make} {listing.model}
            {listing.trim ? ` ${listing.trim}` : ""}
          </h3>
        </Link>
        {!listing.isNew && (
          <div className="mt-0.5 text-[11px] text-[#63666A]">
            {listing.kms.toLocaleString()} km
          </div>
        )}

        <div className="mt-2 text-xl font-bold text-[#141414] leading-none">
          {formatAED(listing.priceAED, locale)}
        </div>
        <div className="mt-1 text-[11px] text-[#141414] underline underline-offset-2 decoration-[#8136B2]/50">
          Est. {formatAED(monthlyEMI(listing.priceAED), locale)}/mo
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <DealBadge rating={listing.dealRating} />
          <HighDemandBadge show={isHighDemand(listing)} />
          {listing.isInspected && (
            <Badge tone="inspected">
              <BadgeCheck className="h-2 w-2 mr-0.5" /> Inspected
            </Badge>
          )}
          {listing.isExportReady && <Badge tone="export">Export</Badge>}
        </div>

        <div className="mt-auto pt-3 flex items-end justify-between gap-3">
          <div className="min-w-0 text-[11px] text-[#63666A]">
            <div className="font-medium text-[#141414] truncate">
              {listing.dealer.name}
            </div>
            <div className="mt-0.5 flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{listing.emirate}, UAE</span>
            </div>
          </div>
          <Link
            href={href}
            className="flex-shrink-0 inline-flex items-center justify-center h-9 px-4 rounded-full bg-[#141414] text-white text-xs font-semibold hover:bg-[#2E2C28] transition-colors"
          >
            Check availability
          </Link>
        </div>
      </div>
    </div>
  );
}
