import { setRequestLocale } from "next-intl/server";
import { ListingRow } from "@/components/listings/listing-row";
import { ListingCard } from "@/components/listings/listing-card";
import { ViewToggle } from "@/components/listings/view-toggle";
import { FilterSidebar } from "@/components/listings/filter-sidebar";
import { ActiveFilters } from "@/components/listings/active-filters";
import { SaveSearchButton } from "@/components/listings/save-search-button";
import { MobileFilterBar } from "@/components/listings/mobile-filter-bar";
import { ListingSortSelect } from "@/components/listings/listings-toolbar";
import { Pagination } from "@/components/listings/pagination";
import { searchListings } from "@/lib/data/listings";
import { parseListingParams } from "@/lib/data/search-params";
import { SearchX, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/routing";

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
  const view = (Array.isArray(sp.view) ? sp.view[0] : sp.view) === "grid" ? "grid" : "list";

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 py-5 pb-16">
      {/* Breadcrumb — cars.com SRP is a white page: breadcrumb + H1, no hero band */}
      <nav className="flex items-center gap-1 text-[11px] text-[#63666A]">
        <Link href="/" className="hover:underline underline-offset-2">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-[#B9B9C4]" />
        <span className="text-[#141414]">Cars for sale</span>
      </nav>

      {/* H1 + sort */}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight text-[#141414]">
          {query.q ? (
            <>Results for &ldquo;{query.q}&rdquo;</>
          ) : (
            <>New and used cars for sale across the UAE</>
          )}
        </h1>
        <ListingSortSelect className="w-48" />
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6">
        <FilterSidebar
          className="hidden lg:block"
          facets={result.facets}
          total={result.total}
        />

        <div className="min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <MobileFilterBar facets={result.facets} total={result.total} />
              <div className="text-xs text-[#63666A]">
                <span className="text-[#141414] font-bold">
                  {result.total.toLocaleString()}
                </span>{" "}
                matches
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ViewToggle view={view} />
              <SaveSearchButton className="hidden sm:inline-flex" />
            </div>
          </div>

          <ActiveFilters />

          {/* Results — list rows or a card grid */}
          {result.items.length > 0 ? (
            view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {result.items.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    locale={locale as "en" | "ar"}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {result.items.map((listing) => (
                  <ListingRow
                    key={listing.id}
                    listing={listing}
                    locale={locale as "en" | "ar"}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-24 rounded-lg bg-white border border-[#E5E5EA]">
              <SearchX className="h-8 w-8 text-muted mb-3" />
              <h3 className="text-sm font-semibold text-[#141414]">
                No cars match your filters
              </h3>
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
  );
}
