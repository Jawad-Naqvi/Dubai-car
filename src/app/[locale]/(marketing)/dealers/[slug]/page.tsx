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
import { RadialGlow } from "@/components/marketing/radial-glow";
import {
  BadgeCheck,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  ChevronRight,
  ShieldCheck,
  SearchX,
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
    // Unfiltered count for the hero stats, independent of inventory filters.
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

  const stats = [
    { label: "Cars in stock", value: baseline.total.toLocaleString() },
    { label: "Rating", value: Number(dealer.rating).toFixed(1) },
    { label: "Reviews", value: dealer.reviewCount.toLocaleString() },
    { label: "Location", value: dealer.emirate },
  ];

  return (
    <>
      {/* ------------------------------------------------ Hero */}
      <section className="relative">
        <div className="h-40 lg:h-56 bg-[#FBE7D4] relative overflow-hidden">
          <RadialGlow color="gold" size="xl" className="-top-40 -right-40 opacity-30" />
        </div>

        <div className="mx-auto max-w-7xl px-4 lg:px-6 -mt-24">
          {/* Breadcrumb */}
          <nav className="mb-3 flex items-center gap-1 text-xs relative z-10">
            <Link href="/dealers" className="hover:underline underline-offset-2 text-[#141414]/70 hover:text-[#141414]">
              Dealers
            </Link>
            <ChevronRight className="h-3 w-3 text-[#141414]/40" />
            <span className="text-[#141414] font-medium truncate">{dealer.name}</span>
          </nav>

          <div className="rounded-3xl bg-white border border-[#E7E4DA] shadow-card p-5 lg:p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-start gap-5">
              <div className="h-20 w-20 lg:h-24 lg:w-24 rounded-2xl bg-[#181C30] flex items-center justify-center text-white font-black text-2xl flex-shrink-0 ring-4 ring-white">
                {dealer.name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                    {dealer.name}
                  </h1>
                  {dealer.isVerified && (
                    <BadgeCheck className="h-6 w-6 text-[#F0941F]" />
                  )}
                  {dealer.isFeatured && <Badge tone="featured">Featured</Badge>}
                </div>

                <a
                  href="#reviews"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm group"
                >
                  <StarRating value={dealer.rating} size="h-4 w-4" />
                  <span className="font-semibold">{Number(dealer.rating).toFixed(1)}</span>
                  <span className="text-muted group-hover:underline underline-offset-2">
                    ({dealer.reviewCount.toLocaleString()} reviews)
                  </span>
                </a>

                {dealer.tagline && (
                  <p className="mt-2 text-sm text-secondary max-w-xl">
                    {dealer.tagline}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-secondary">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted" />
                    {dealer.address ? `${dealer.address}, ` : ""}
                    {dealer.emirate}, UAE
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted" />
                    Open daily · 9am – 9pm
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap md:flex-col gap-2 flex-shrink-0">
                <Button asChild variant="gold" size="md">
                  <a href={`tel:${dealer.phone ?? brand.whatsapp}`}>
                    <Phone className="h-4 w-4" />
                    Call dealer
                  </a>
                </Button>
                <Button asChild variant="emerald" size="md">
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

            {/* Stats strip */}
            <div className="mt-5 pt-5 border-t border-[#E7E4DA] grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-lg font-bold text-[#141414] leading-none">
                    {s.value}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-muted">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Body */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
            {/* Main column: inventory + about */}
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-2 mb-4">
                <h2 className="text-xl lg:text-2xl font-bold tracking-tight">
                  Inventory
                  <span className="ml-2 text-sm font-normal text-muted">
                    {hasInventoryFilters
                      ? `${result.total} of ${baseline.total} cars`
                      : `${result.total} car${result.total === 1 ? "" : "s"}`}
                  </span>
                </h2>
              </div>

              <InventoryToolbar makes={result.facets.makes} />

              {result.items.length === 0 ? (
                <div className="mt-4 flex flex-col items-center justify-center text-center py-20 rounded-3xl bg-white border border-[#E7E4DA] shadow-card">
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
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* About */}
              {(dealer.description || dealer.address) && (
                <div className="mt-10 rounded-3xl bg-white border border-[#E7E4DA] shadow-card p-6">
                  <h2 className="text-lg font-bold tracking-tight">
                    About {dealer.name}
                  </h2>
                  {dealer.description && (
                    <p className="mt-3 text-sm text-secondary leading-relaxed">
                      {dealer.description}
                    </p>
                  )}
                  {dealer.address && (
                    <p className="mt-3 text-xs text-secondary inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted" />
                      {dealer.address}, {dealer.emirate}, UAE
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Sticky contact rail */}
            <aside className="lg:sticky lg:top-20 space-y-4">
              <div className="rounded-3xl bg-white border border-[#E7E4DA] shadow-card p-5">
                <h3 className="text-sm font-bold tracking-tight">
                  Contact {dealer.name}
                </h3>
                <p className="mt-1 text-[11px] text-muted">
                  Mention {brand.name} for the fastest response.
                </p>
                <div className="mt-4 space-y-2">
                  <Button asChild variant="gold" size="md" className="w-full">
                    <a href={`tel:${dealer.phone ?? brand.whatsapp}`}>
                      <Phone className="h-4 w-4" />
                      Call dealer
                    </a>
                  </Button>
                  <Button asChild variant="emerald" size="md" className="w-full">
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
                  <Button asChild variant="ghost" size="md" className="w-full">
                    <Link href="/contact">
                      <Mail className="h-4 w-4" />
                      Send a message
                    </Link>
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t border-[#E7E4DA] space-y-2 text-xs text-secondary">
                  <p className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted mt-0.5 flex-shrink-0" />
                    {dealer.address ? `${dealer.address}, ` : ""}
                    {dealer.emirate}, UAE
                  </p>
                  <p className="flex items-start gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted mt-0.5 flex-shrink-0" />
                    Open daily, 9am – 9pm
                  </p>
                </div>
              </div>

              {dealer.isVerified && (
                <div className="rounded-3xl bg-[#1A7A4A]/10 border border-[#1A7A4A]/20 p-4 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-[#1A7A4A] flex-shrink-0" />
                  <p className="text-[11px] text-secondary leading-relaxed">
                    <span className="font-semibold text-[#141414]">
                      Verified dealer.
                    </span>{" "}
                    Trade license checked and approved by the {brand.name} team.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      <div id="reviews">
        <ReviewsSection slug={slug} />
      </div>

      {/* ------------------------------------------------ More dealers */}
      {moreDealers.length > 0 && (
        <section className="py-10 border-t border-[#E7E4DA]">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold tracking-tight">
                More dealers to explore
              </h2>
              <Link
                href="/dealers"
                className="text-xs font-semibold text-[#141414] underline underline-offset-2 hover:opacity-70"
              >
                View all dealers
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 max-w-4xl">
              {moreDealers.map((d) => (
                <DealerCard key={d.id} dealer={d} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
