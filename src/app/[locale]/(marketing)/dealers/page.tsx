import { setRequestLocale } from "next-intl/server";
import { auth } from "@clerk/nextjs/server";
import { Link } from "@/i18n/routing";
import { getDealers, type DealerView } from "@/lib/data/dealers";
import { SignupWall } from "@/components/marketing/signup-wall";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { DealerCard } from "@/components/dealers/dealer-card";
import {
  DealerSearchBar,
  DealerFilterSortBar,
  DealerActiveFilters,
} from "@/components/dealers/dealers-toolbar";
import { Pagination } from "@/components/listings/pagination";
import { SearchX, Store } from "lucide-react";

const PER_PAGE = 12;
/** Dealers a signed-out visitor sees before the sign-up wall. */
const GUEST_LIMIT = 8;

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Rebuild the current query string so auth CTAs return to this exact view. */
function queryString(sp: SearchParams): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "page") continue;
    if (Array.isArray(v)) v.forEach((x) => x && qs.append(k, x));
    else if (v) qs.set(k, v);
  }
  return qs.toString();
}

function filterAndSort(dealers: DealerView[], sp: SearchParams): DealerView[] {
  const q = first(sp.q)?.trim().toLowerCase();
  const emirate = first(sp.emirate);
  const minRating = Number(first(sp.rating)) || 0;
  const verifiedOnly = first(sp.verified) === "1";
  const sort = first(sp.sort) ?? "recommended";

  let out = dealers.filter((d) => {
    if (q && !`${d.name} ${d.tagline}`.toLowerCase().includes(q)) return false;
    if (emirate && d.emirate !== emirate) return false;
    if (minRating && Number(d.rating) < minRating) return false;
    if (verifiedOnly && !d.isVerified) return false;
    return true;
  });

  switch (sort) {
    case "rating_desc":
      out = out.sort((a, b) => Number(b.rating) - Number(a.rating));
      break;
    case "reviews_desc":
      out = out.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    case "inventory_desc":
      out = out.sort((a, b) => b.listingCount - a.listingCount);
      break;
    case "name_asc":
      out = out.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      // recommended — featured first, then rating
      out = out.sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) ||
          Number(b.rating) - Number(a.rating),
      );
  }
  return out;
}

export default async function DealersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const { userId } = await auth();
  const isGuest = !userId;

  const allDealers = await getDealers();
  const results = filterAndSort(allDealers, sp);

  const page = isGuest ? 1 : Math.max(1, parseInt(first(sp.page) ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));

  // Cap the public directory for signed-out visitors.
  const gated = isGuest && results.length > GUEST_LIMIT;
  const pageItems = gated
    ? results.slice(0, GUEST_LIMIT)
    : results.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const redirectTo = `/${locale}/dealers${queryString(sp) ? `?${queryString(sp)}` : ""}`;

  const hasFilters = Boolean(
    first(sp.q) || first(sp.emirate) || first(sp.rating) || first(sp.verified),
  );

  return (
    <>
      {/* Hero strip */}
      <div className="relative bg-[#F4F4F6] py-8 lg:py-10 border-b border-[#E5E5EA]">
        <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
          <Eyebrow tone="gold">VERIFIED DEALER DIRECTORY</Eyebrow>
          <h1 className="mt-2 text-2xl lg:text-3xl font-light tracking-tight">
            {allDealers.length} <span className="font-extrabold">verified dealers</span>{" "}
            across the UAE
          </h1>
          <p className="mt-1.5 text-xs text-secondary max-w-xl">
            Every dealer carries a valid trade license and passes our
            verification process. Browse storefronts, compare inventory, and
            contact them directly.
          </p>

          <DealerSearchBar className="mt-4 max-w-2xl" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6 pb-16">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="text-xs text-secondary">
            <span className="text-[#141414] font-semibold">{results.length}</span>{" "}
            dealer{results.length === 1 ? "" : "s"}
            {first(sp.q) ? (
              <>
                {" "}
                matching{" "}
                <span className="text-[#141414] font-semibold">
                  &ldquo;{first(sp.q)}&rdquo;
                </span>
              </>
            ) : null}
          </div>
          <DealerFilterSortBar />
        </div>

        <DealerActiveFilters />

        {/* Results — marketplace grid */}
        {pageItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pageItems.map((d) => (
              <DealerCard key={d.id} dealer={d} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-24 rounded-2xl bg-white border border-[#E5E5EA] shadow-card">
            <SearchX className="h-8 w-8 text-muted mb-3" />
            <h3 className="text-sm font-semibold text-[#141414]">
              No dealers match your filters
            </h3>
            <p className="mt-1 text-xs text-muted max-w-xs">
              Try a different emirate, lower the rating bar, or clear your
              search.
            </p>
            {hasFilters && (
              <Link
                href="/dealers"
                className="mt-4 text-xs text-[#141414] font-semibold underline underline-offset-2 hover:opacity-70"
              >
                Reset all filters
              </Link>
            )}
          </div>
        )}

        {gated ? (
          <SignupWall
            remaining={results.length - GUEST_LIMIT}
            total={results.length}
            label="dealers"
            redirectTo={redirectTo}
          />
        ) : (
          <Pagination page={page} totalPages={totalPages} />
        )}

        {/* Become-a-dealer CTA */}
        <div className="mt-10 rounded-2xl bg-[#370B55] text-white p-6 lg:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Store className="h-5 w-5 text-[#8136B2]" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Run a showroom? Get listed here.
              </h2>
              <p className="mt-1 text-xs text-white/70 max-w-md">
                Verified dealers get a branded storefront, buyer leads, and
                bulk inventory tools. Approval usually takes under 48 hours.
              </p>
            </div>
          </div>
          <Button asChild variant="onDark" size="md" className="flex-shrink-0">
            <Link href="/sell/become-seller">Become a dealer</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
