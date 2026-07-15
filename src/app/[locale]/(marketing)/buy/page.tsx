import { setRequestLocale } from "next-intl/server";
import { ListingCard } from "@/components/listings/listing-card";
import { FilterSidebar } from "@/components/listings/filter-sidebar";
import { ActiveFilters } from "@/components/listings/active-filters";
import { MobileFilterBar } from "@/components/listings/mobile-filter-bar";
import {
  ListingSearchBar,
  ListingSortBar,
} from "@/components/listings/listings-toolbar";
import { Pagination } from "@/components/listings/pagination";
import { Eyebrow } from "@/components/ui/eyebrow";
import { searchListings } from "@/lib/data/listings";
import { parseListingParams } from "@/lib/data/search-params";
import { SearchX } from "lucide-react";
import Link from "next/link";

export default async function BuyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const query = parseListingParams(sp);
  const result = await searchListings(query);

  const dealerCount = new Set(result.items.map((l) => l.dealer.id)).size;

  return (
    <div className="relative">
      {/* Hero strip */}
      <div className="relative bg-[#F3F1E9] py-8 lg:py-10 border-b border-[#E7E4DA]">
        <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
          <Eyebrow tone="gold">BROWSE INVENTORY</Eyebrow>
          <h1 className="mt-2 text-2xl lg:text-3xl font-light tracking-tight">
            {result.total.toLocaleString()} verified cars{" "}
            <span className="font-extrabold">across the UAE</span>
          </h1>
          <p className="mt-1.5 text-xs text-secondary max-w-xl">
            Hand-picked listings from {dealerCount}+ verified yards.
          </p>

          <ListingSearchBar className="mt-4 max-w-2xl" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
          <FilterSidebar
            className="hidden lg:block"
            facets={result.facets}
            total={result.total}
          />

          <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <MobileFilterBar facets={result.facets} total={result.total} />
                <div className="text-xs text-secondary">
                  <span className="text-[#141414] font-semibold">{result.total}</span>{" "}
                  results
                  {query.q ? (
                    <>
                      {" "}
                      for{" "}
                      <span className="text-[#141414] font-semibold">&ldquo;{query.q}&rdquo;</span>
                    </>
                  ) : null}
                </div>
              </div>
              <ListingSortBar />
            </div>

            <ActiveFilters />

            {/* Listing grid */}
            {result.items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {result.items.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    locale={locale as "en" | "ar"}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-24 rounded-3xl bg-white border border-[#E7E4DA] shadow-card">
                <SearchX className="h-8 w-8 text-muted mb-3" />
                <h3 className="text-sm font-semibold text-[#141414]">No cars match your filters</h3>
                <p className="mt-1 text-xs text-muted max-w-xs">
                  Try widening your price range or clearing a filter.
                </p>
                <Link
                  href="/buy"
                  className="mt-4 text-xs text-[#141414] font-semibold underline underline-offset-2 hover:opacity-70"
                >
                  Reset all filters
                </Link>
              </div>
            )}

            <Pagination page={result.page} totalPages={result.totalPages} />
          </div>
        </div>
      </div>
    </div>
  );
}
