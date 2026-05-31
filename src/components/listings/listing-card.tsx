import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatAED, monthlyEMI } from "@/lib/utils";
import { MapPin, Gauge, Calendar, Fuel, Lock, BadgeCheck } from "lucide-react";
import type { MockListing } from "@/lib/mock-data";
import { SaveButton } from "./save-button";
import { CompareButton } from "./compare-button";

export function ListingCard({
  listing,
  locale = "en",
}: {
  listing: MockListing;
  locale?: "en" | "ar";
}) {
  return (
    <div className="group relative rounded bg-[#161616] border border-white/8 overflow-hidden hover:border-[#D4AF37]/40 transition-all flex flex-col">
      <Link
        href={`/listings/${listing.id}/${listing.slug}`}
        className="block relative aspect-[4/3] overflow-hidden bg-[#121212]"
      >
        <Image
          src={listing.imageUrl}
          alt={`${listing.year} ${listing.make} ${listing.model}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-50" />

        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {listing.isFeatured && <Badge tone="featured">Featured</Badge>}
          {listing.isNew && <Badge tone="new">New</Badge>}
          {listing.isExportReady && <Badge tone="export">Export</Badge>}
          {listing.isInspected && (
            <Badge tone="inspected">
              <BadgeCheck className="h-2 w-2 mr-0.5" /> Inspected
            </Badge>
          )}
          {listing.status === "reserved" && <Badge tone="reserved">Reserved</Badge>}
        </div>

        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          <SaveButton listingId={listing.id} className="h-7 w-7" />
          <CompareButton listingId={listing.id} />
        </div>
      </Link>

      <div className="p-3.5 flex-1 flex flex-col">
        <Link
          href={`/listings/${listing.id}/${listing.slug}`}
          className="block"
        >
          <h3 className="text-sm font-semibold tracking-tight leading-snug line-clamp-1 group-hover:text-[#F0CE5C] transition-colors">
            {listing.year} {listing.make} {listing.model}
          </h3>
          {listing.trim && (
            <p className="mt-0.5 text-[11px] text-muted line-clamp-1">
              {listing.trim}
            </p>
          )}
        </Link>

        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div>
            <div className="text-lg font-bold text-gradient-gold leading-none">
              {formatAED(listing.priceAED, locale)}
            </div>
            <div className="mt-0.5 text-[10px] text-muted">
              From {formatAED(monthlyEMI(listing.priceAED), locale)}/mo
            </div>
          </div>
          <div className="text-[10px] text-secondary text-right">
            <div>{listing.regionalSpec}</div>
            <div className="text-muted">{listing.transmission}</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5 text-[10px] text-secondary border-t border-white/5 pt-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5 text-muted" />
            {listing.year}
          </div>
          <div className="flex items-center gap-1">
            <Gauge className="h-2.5 w-2.5 text-muted" />
            {(listing.kms / 1000).toFixed(0)}k km
          </div>
          <div className="flex items-center gap-1">
            <Fuel className="h-2.5 w-2.5 text-muted" />
            {listing.fuel}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-white/5">
          <div className="flex items-center gap-1 text-[10px] text-secondary min-w-0">
            <MapPin className="h-2.5 w-2.5 text-muted flex-shrink-0" />
            <span className="truncate">{listing.emirate}</span>
          </div>
          <Link
            href={`/listings/${listing.id}/${listing.slug}`}
            className="flex items-center gap-1 text-[10px] text-[#F0CE5C] font-semibold hover:underline"
          >
            <Lock className="h-2.5 w-2.5" />
            View seller
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="rounded bg-[#161616] border border-white/8 overflow-hidden">
      <div className="aspect-[4/3] bg-white/5 animate-pulse" />
      <div className="p-3.5 space-y-2">
        <div className="h-3 w-3/4 bg-white/5 rounded animate-pulse" />
        <div className="h-5 w-1/2 bg-white/5 rounded animate-pulse" />
      </div>
    </div>
  );
}
