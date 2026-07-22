import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { getDealers, getDealerBySlug } from "@/lib/data/dealers";
import { brand } from "@/lib/brand";
import { whatsappLink } from "@/lib/utils";
import { searchListings, type SortKey } from "@/lib/data/listings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listings/listing-card";
import { ReviewsSection } from "@/components/dealers/reviews-section";
import { StarRating } from "@/components/dealers/star-rating";
import { DealerCard } from "@/components/dealers/dealer-card";
import { InventoryToolbar } from "@/components/dealers/inventory-toolbar";
import { Pagination } from "@/components/listings/pagination";
import {
  BadgeCheck,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  ChevronRight,
  ShieldCheck,
  SearchX,
  Heart,
} from "lucide-react";

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

const INVENTORY_PER_PAGE = 12;

export default async function DealerStorefront({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const dealer = await getDealerBySlug(slug);
  if (!dealer) notFound();

  const sp = await searchParams;
  const q = first(sp.q)?.trim() || undefined;
  const make = first(sp.make) || undefined;
  const sort = (first(sp.sort) as SortKey | undefined) ?? "newest";
  const page = Math.max(1, parseInt(first(sp.page) ?? "1", 10) || 1);

  const [result, baseline, allDealers] = await Promise.all([
    searchListings({
      dealerSlug: slug,
      q,
      make: make ? [make] : undefined,
      sort,
      page,
      perPage: INVENTORY_PER_PAGE,
    }),
    // Unfiltered count for the header, independent of inventory filters.
    searchListings({ dealerSlug: slug, perPage: 1 }),
    getDealers(),
  ]);

  const hasInventoryFilters = Boolean(q || make || first(sp.sort));

  const moreDealers = allDealers
    .filter((d) => d.slug !== slug)
    .sort(
      (a, b) =>
        Number(b.emirate === dealer.emirate) -
          Number(a.emirate === dealer.emirate) ||
        Number(b.rating) - Number(a.rating),
    )
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 py-5 pb-16">
      {/* Breadcrumb — cars.com dealer page is a flat white page */}
      <nav className="flex items-center gap-1 text-[11px] text-[#63666A]">
        <Link href="/" className="hover:underline underline-offset-2">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-[#B9B9C4]" />
        <Link href="/dealers" className="hover:underline underline-offset-2">
          Find a dealer
        </Link>
        <ChevronRight className="h-3 w-3 text-[#B9B9C4]" />
        <span className="text-[#141414] truncate">{dealer.name}</span>
      </nav>

      {/* ------------------------------------------------ Dealer header */}
      <div className="mt-4 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-3xl lg:text-[40px] leading-[1.05] font-extrabold tracking-tight text-[#141414]">
              {dealer.name}
            </h1>
            {dealer.isVerified && (
              <BadgeCheck className="h-7 w-7 text-[#8136B2] flex-shrink-0" />
            )}
            {dealer.isFeatured && <Badge tone="featured">Featured</Badge>}
          </div>

          <a href="#reviews" className="mt-2 inline-flex items-center gap-1.5 text-sm group">
            <span className="font-semibold">{Number(dealer.rating).toFixed(1)}</span>
            <StarRating value={dealer.rating} size="h-4 w-4" />
            <span className="text-[#63666A] group-hover:underline underline-offset-2">
              ({dealer.reviewCount.toLocaleString()} reviews)
            </span>
          </a>

          <div className="mt-2.5 space-y-1.5 text-sm">
            <p className="flex items-center gap-1.5 text-[#141414]">
              <MapPin className="h-4 w-4 text-[#63666A] flex-shrink-0" />
              <span className="underline underline-offset-2">
                {dealer.address ? `${dealer.address}, ` : ""}
                {dealer.emirate}, UAE
              </span>
            </p>
            <p className="flex items-center gap-1.5 text-[#63666A]">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>
                <span className="text-[#141414] font-medium">Sales hours:</span>{" "}
                9:00am to 9:00pm, daily
              </span>
            </p>
            {dealer.tagline && (
              <p className="text-[#63666A] max-w-xl">{dealer.tagline}</p>
            )}
          </div>
        </div>

        {/* Contact actions — cars.com keeps phones top-right */}
        <div className="flex md:flex-col flex-wrap gap-2 flex-shrink-0 md:text-right">
          <Button asChild variant="gold" size="md">
            <a href={`tel:${dealer.phone ?? brand.whatsapp}`}>
              <Phone className="h-4 w-4" />
              Call dealer
            </a>
          </Button>
          <Button asChild variant="ghost" size="md">
            <a
              href={whatsappLink(
                dealer.whatsapp ?? brand.whatsapp,
                `Hi ${dealer.name}, I found your showroom on ${brand.name} and I'd like to know more about your inventory.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------ Inventory */}
      <section className="mt-10">
        <h2 className="text-xl lg:text-2xl font-extrabold tracking-tight text-[#141414]">
          Inventory
        </h2>

        <div className="mt-3">
          <InventoryToolbar makes={result.facets.makes} />
        </div>

        <p className="mt-3 text-xs font-bold text-[#141414]">
          {hasInventoryFilters
            ? `${result.total.toLocaleString()} of ${baseline.total.toLocaleString()} matches`
            : `${result.total.toLocaleString()} matches`}
        </p>

        {result.items.length === 0 ? (
          <div className="mt-3 flex flex-col items-center justify-center text-center py-20 rounded-lg bg-white border border-[#E5E5EA]">
            <SearchX className="h-8 w-8 text-muted mb-3" />
            <h3 className="text-sm font-semibold text-[#141414]">
              {hasInventoryFilters
                ? "No cars match your search"
                : "No active listings yet"}
            </h3>
            <p className="mt-1 text-xs text-muted max-w-xs">
              {hasInventoryFilters
                ? "Try clearing the make filter or searching for something else."
                : "Check back soon — this dealer is still stocking their storefront."}
            </p>
            {hasInventoryFilters && (
              <Link
                href={`/dealers/${slug}`}
                className="mt-4 text-xs text-[#141414] font-semibold underline underline-offset-2 hover:opacity-70"
              >
                Reset inventory filters
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {result.items.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                locale={locale as "en" | "ar"}
              />
            ))}
          </div>
        )}

        <Pagination page={result.page} totalPages={result.totalPages} />
      </section>

      {/* ------------------------------------------------ About */}
      <section className="mt-12">
        <h2 className="text-xl lg:text-2xl font-extrabold tracking-tight text-[#141414]">
          About our dealership
        </h2>
        <p className="mt-3 flex items-center gap-2 text-sm text-[#63666A]">
          <Heart className="h-4 w-4 text-[#8136B2]" />
          This seller is a verified {brand.name} partner in {dealer.emirate}.
        </p>
        {dealer.description && (
          <p className="mt-3 text-sm text-[#63666A] leading-relaxed max-w-3xl">
            {dealer.description}
          </p>
        )}
        {dealer.isVerified && (
          <p className="mt-3 inline-flex items-start gap-2 text-xs text-[#63666A] bg-[#F4F4F6] rounded-md px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-[#137A43] flex-shrink-0" />
            <span>
              <span className="font-semibold text-[#141414]">Verified dealer.</span>{" "}
              Trade license checked and approved by the {brand.name} team.
            </span>
          </p>
        )}
      </section>

      <div id="reviews" className="mt-6">
        <ReviewsSection slug={slug} />
      </div>

      {/* ------------------------------------------------ More dealers */}
      {moreDealers.length > 0 && (
        <section className="mt-12 pt-8 border-t border-[#E5E5EA]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-extrabold tracking-tight">
              More dealers to explore
            </h2>
            <Link
              href="/dealers"
              className="text-xs font-semibold text-[#141414] underline underline-offset-2 hover:opacity-70"
            >
              View all dealers
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {moreDealers.map((d) => (
              <DealerCard key={d.id} dealer={d} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
