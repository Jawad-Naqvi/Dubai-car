import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import {
  getListingById,
  getSimilarListings,
  getListingMedia,
  incrementViewCount,
} from "@/lib/data/listings";
import { formatAED, formatKm, monthlyEMI, cn } from "@/lib/utils";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { FinanceCalculator } from "@/components/listings/finance-calculator";
import { ExportQuoteButton } from "@/components/listings/export-quote-button";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listings/listing-card";
import { ContactPaywall } from "@/components/listings/paywall";
import { MobileContactBar } from "@/components/listings/mobile-contact-bar";
import { DealBadge, HighDemandBadge } from "@/components/listings/deal-badge";
import { PriceContextMeter } from "@/components/listings/price-context-meter";
import { isHighDemand } from "@/lib/vehicle-derive";
import { ReportListingButton } from "@/components/listings/report-listing-button";
import { InspectionReport } from "@/components/listings/inspection-report";
import { getInspection } from "@/lib/data/inspection";
import { VehicleHistory } from "@/components/listings/vehicle-history";
import { getVehicleHistory } from "@/lib/data/vehicle-history";
import { PriceHistoryTable } from "@/components/listings/price-history-table";
import { getPriceHistory } from "@/lib/data/price";
import { StarRating } from "@/components/dealers/star-rating";
import {
  MapPin,
  BadgeCheck,
  Calendar,
  Gauge,
  Fuel,
  Settings2,
  Palette,
  Car,
  Globe,
  Cog,
  CheckCircle2,
  Ship,
  FileText,
  ShieldCheck,
  Sparkles,
  Clock,
  ChevronRight,
} from "lucide-react";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://dxbmotors.ae";

/** Human "days on market" signal from a listing's listed/created date. */
function daysOnMarket(listedAt?: string): string | null {
  if (!listedAt) return null;
  const days = Math.floor((Date.now() - new Date(listedAt).getTime()) / 86_400_000);
  if (days < 0) return null;
  if (days === 0) return "Listed today";
  if (days === 1) return "Listed yesterday";
  if (days <= 30) return `Listed ${days} days ago`;
  return `On the market ${Math.floor(days / 30)} mo`;
}

/** Per-car SEO: unique title, description and OG image so each listing ranks. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, id, slug } = await params;
  const listing = await getListingById(id);
  if (!listing) return { title: "Car not found — DXB Motors" };

  const title = `${listing.year} ${listing.make} ${listing.model}${listing.trim ? ` ${listing.trim}` : ""} for sale in ${listing.emirate} — ${formatAED(listing.priceAED)}`;
  const description = `${listing.year} ${listing.make} ${listing.model} · ${formatKm(listing.kms, locale as "en" | "ar")} · ${listing.fuel} · ${listing.transmission} · ${listing.regionalSpec} spec. ${formatAED(listing.priceAED)} at ${listing.dealer.name}, ${listing.emirate}. View photos, specs and finance options on DXB Motors.`;
  const image = listing.imageUrl?.startsWith("http")
    ? listing.imageUrl
    : `${SITE_URL}${listing.imageUrl ?? ""}`;
  const canonical = `${SITE_URL}/${locale}/listings/${id}/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

/** Section heading — cars.com uses plain bold sentence-case headings. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold tracking-tight text-[#141414]">
      {children}
    </h2>
  );
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; slug: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const listing = await getListingById(id);
  if (!listing) notFound();

  const t = await getTranslations("listing");
  const [similar, media, inspection, history, priceHistory] = await Promise.all([
    getSimilarListings(listing, 4),
    getListingMedia(id),
    getInspection(listing),
    getVehicleHistory(listing),
    getPriceHistory(id),
  ]);
  // fire-and-forget view counter (no-op when DB is off)
  void incrementViewCount(id);

  const gallery = media.length > 0 ? media : [listing.imageUrl];
  const emi = monthlyEMI(listing.priceAED);
  const listingTitle = `${listing.year} ${listing.make} ${listing.model}`;
  const loc = locale as "en" | "ar";
  // "Service history" is a real signal only when the seller listed it as a feature.
  const hasServiceHistory = (listing.features ?? []).some((f) =>
    /service history|full history|dealer history/i.test(f),
  );

  const specs = [
    { icon: Calendar, label: t("year"), value: listing.year },
    { icon: Gauge, label: t("km"), value: formatKm(listing.kms, loc) },
    { icon: Fuel, label: t("fuel"), value: listing.fuel },
    { icon: Settings2, label: t("transmission"), value: listing.transmission },
    { icon: Globe, label: t("regionalSpec"), value: listing.regionalSpec },
    { icon: Palette, label: t("color"), value: listing.exteriorColor },
    { icon: Car, label: t("bodyType"), value: listing.bodyType },
    { icon: Cog, label: "Status", value: listing.status.toUpperCase() },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${listingTitle} ${listing.trim ?? ""}`.trim(),
    brand: { "@type": "Brand", name: listing.make },
    model: listing.model,
    vehicleModelDate: String(listing.year),
    color: listing.exteriorColor,
    fuelType: listing.fuel,
    vehicleTransmission: listing.transmission,
    bodyType: listing.bodyType,
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: listing.kms,
      unitCode: "KMT",
    },
    offers: {
      "@type": "Offer",
      price: listing.priceAED,
      priceCurrency: "AED",
      availability: "https://schema.org/InStock",
      seller: { "@type": "AutoDealer", name: listing.dealer.name },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-4 pb-24 lg:pb-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-[11px] text-[#63666A] overflow-x-auto whitespace-nowrap pb-1">
          <Link href="/" className="hover:underline underline-offset-2">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-[#B9B9C4] flex-shrink-0" />
          <Link
            href={`/buy?make=${encodeURIComponent(listing.make)}`}
            className="hover:underline underline-offset-2"
          >
            Shop {listing.isNew ? "new" : "used"} {listing.make}{" "}
            {listing.model}s
          </Link>
          <ChevronRight className="h-3 w-3 text-[#B9B9C4] flex-shrink-0" />
          <span className="text-[#141414]">
            {listing.isNew ? "New" : "Used"} {listingTitle}
          </span>
        </nav>

        {/* Gallery mosaic */}
        <div className="mt-2">
          <ListingGallery
            images={gallery}
            title={listingTitle}
            listingId={listing.id}
            badges={{
              featured: listing.isFeatured,
              exportReady: listing.isExportReady,
              inspected: listing.isInspected,
              reserved: listing.status === "reserved",
            }}
          />
        </div>

        {/* H1 below gallery — cars.com VDP pattern */}
        <h1 className="mt-5 text-2xl lg:text-[32px] font-extrabold tracking-tight leading-tight text-[#141414]">
          {listing.isNew ? "New" : "Used"} {listingTitle}
          {listing.trim ? ` ${listing.trim}` : ""}
        </h1>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
          {/* ---------------------------------------------- LEFT column */}
          <div className="min-w-0 space-y-5">
            {/* Price summary card */}
            <div className="rounded-lg bg-white border border-[#E5E5EA] p-5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-2xl font-extrabold text-[#141414] leading-none">
                  {formatAED(listing.priceAED, loc)}
                </span>
                <DealBadge rating={listing.dealRating} />
                <HighDemandBadge show={isHighDemand(listing)} />
              </div>

              {listing.previousPrice ? (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-xs text-[#63666A] line-through">
                    {formatAED(listing.previousPrice, loc)}
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[#137A43] text-white px-1.5 py-0.5 text-[10px] font-semibold">
                    {formatAED(listing.previousPrice - listing.priceAED, loc)} price drop
                  </span>
                </div>
              ) : (
                <a
                  href="#finance"
                  className="mt-2 inline-block text-xs text-[#141414] underline underline-offset-2 decoration-[#8136B2]/50"
                >
                  Est. {formatAED(emi, loc)}/mo
                </a>
              )}

              <div className="mt-3 pt-3 border-t border-[#E5E5EA] flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#63666A]">
                {!listing.isNew && <span>{formatKm(listing.kms, loc)}</span>}
                <span>{listing.regionalSpec} spec</span>
                {daysOnMarket(listing.listedAt) && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {daysOnMarket(listing.listedAt)}
                  </span>
                )}
              </div>
            </div>

            {/* Deal meter — price vs similar cars */}
            <PriceContextMeter
              price={listing.priceAED}
              peerPrices={similar.map((s) => s.priceAED)}
              rating={listing.dealRating}
              locale={loc}
            />

            {/* Price history */}
            {priceHistory.length > 0 && (
              <PriceHistoryTable points={priceHistory} locale={loc} />
            )}

            {/* Features & specs */}
            <section className="rounded-lg bg-white border border-[#E5E5EA] p-5">
              <SectionTitle>Features &amp; specs</SectionTitle>
              {listing.vin && (
                <p className="mt-1 text-[11px] text-[#63666A]">
                  VIN: <span className="font-mono">{listing.vin}</span>
                </p>
              )}

              {/* Two-column icon spec list — cars.com layout */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
                {specs.map((s) => (
                  <div key={s.label} className="flex items-center gap-2.5 text-sm">
                    <s.icon className="h-4 w-4 text-[#63666A] flex-shrink-0" />
                    <span className="text-[#141414]">
                      {s.value}{" "}
                      <span className="text-[#63666A] text-xs">· {s.label}</span>
                    </span>
                  </div>
                ))}
              </div>

              {listing.features.length > 0 && (
                <>
                  <h3 className="mt-5 text-sm font-bold text-[#141414]">
                    {t("features")}
                  </h3>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
                    {listing.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-[#141414]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#137A43] flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            {/* Seller's notes */}
            {listing.description && (
              <section>
                <SectionTitle>Seller&rsquo;s notes</SectionTitle>
                <p className="mt-2 text-sm text-[#63666A] leading-relaxed">
                  {listing.description}
                </p>
              </section>
            )}

            {/* Inspection report */}
            {inspection && (
              <section id="inspection" className="scroll-mt-20">
                <SectionTitle>Inspection report</SectionTitle>
                <div className="mt-2">
                  <InspectionReport report={inspection} />
                </div>
              </section>
            )}

            {/* Vehicle history — collapsed by default, one-line summary visible */}
            <div id="history" className="scroll-mt-20">
              <VehicleHistory report={history} />
            </div>

            {/* Finance calculator — collapsed by default, live EMI shown in header */}
            <div id="finance" className="scroll-mt-20">
              <FinanceCalculator price={listing.priceAED} locale={loc} />
            </div>

            {/* Seller's info — cars.com dealer block */}
            <section className="rounded-lg bg-white border border-[#E5E5EA] p-5">
              <SectionTitle>Seller&rsquo;s info</SectionTitle>
              <div className="mt-4 flex items-start gap-3">
                <div className="h-14 w-14 rounded-md bg-[#370B55] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {listing.dealer.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-[#141414]">
                      {listing.dealer.name}
                    </h3>
                    {listing.dealer.isVerified && (
                      <BadgeCheck className="h-4 w-4 text-[#8136B2]" />
                    )}
                  </div>
                  <Link
                    href={`/dealers/${listing.dealer.slug}`}
                    className="mt-1 inline-flex items-center gap-1.5 text-xs group"
                  >
                    <span className="font-semibold">{listing.dealer.rating}</span>
                    <StarRating value={Number(listing.dealer.rating)} size="h-3 w-3" />
                    <span className="text-[#63666A] group-hover:underline underline-offset-2">
                      ({listing.dealer.reviewCount} reviews)
                    </span>
                  </Link>
                </div>
              </div>

              <div className="mt-3 rounded-md bg-[#F4F4F6] px-3 py-2.5 flex items-center gap-2 text-xs text-[#141414]">
                <MapPin className="h-3.5 w-3.5 text-[#63666A] flex-shrink-0" />
                {listing.emirate}, United Arab Emirates
              </div>
              <div className="mt-1.5 rounded-md bg-[#F4F4F6] px-3 py-2.5 flex items-center gap-2 text-xs text-[#141414]">
                <Clock className="h-3.5 w-3.5 text-[#63666A] flex-shrink-0" />
                Open daily · 9am – 9pm
              </div>

              <Button asChild variant="ghost" size="md" className="mt-3 w-full">
                <Link href={`/dealers/${listing.dealer.slug}`}>
                  Visit dealer storefront
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </section>
          </div>

          {/* ---------------------------------------------- RIGHT rail */}
          <div
            id="contact"
            className="lg:sticky lg:top-16 lg:self-start space-y-3 scroll-mt-20"
          >
            {/* Contact seller */}
            <div className="rounded-lg bg-white border border-[#E5E5EA] p-4">
              <h2 className="text-base font-bold tracking-tight text-[#141414]">
                Contact seller
              </h2>
              <p className="mt-0.5 text-[11px] text-[#63666A]">
                {listing.dealer.name} usually responds within a few hours.
              </p>
              <div className="mt-3">
                <ContactPaywall
                  listingId={listing.id}
                  listingTitle={listingTitle}
                  dealerPhone={listing.dealer.phone}
                  dealerWhatsapp={listing.dealer.whatsapp}
                />
              </div>
              <div className="mt-2 flex justify-center">
                <ReportListingButton listingId={listing.id} />
              </div>
            </div>

            {/* Export panel */}
            {listing.isExportReady && (
              <div className="rounded-lg bg-[#F3EDF9] border border-[#E5E5EA] p-4">
                <div className="flex items-center gap-1.5">
                  <Ship className="h-3.5 w-3.5 text-[#8136B2]" />
                  <h3 className="text-sm font-bold text-[#141414]">
                    Export ready — ship worldwide
                  </h3>
                </div>
                <p className="mt-1.5 text-[11px] text-[#63666A] leading-relaxed">
                  RTA deregistration, export certificate, and shipping handled
                  with partner agents.
                </p>
                <ExportQuoteButton
                  listingId={listing.id}
                  listingTitle={listingTitle}
                />
              </div>
            )}

            {/* Trust strip — reflects real listing/dealer data, not static text */}
            <div className="rounded-lg bg-white border border-[#E5E5EA] p-3">
              <div className="space-y-1.5 text-[11px]">
                <div
                  className={cn(
                    "flex items-center gap-1.5",
                    listing.dealer.isVerified ? "text-secondary" : "text-muted",
                  )}
                >
                  <ShieldCheck
                    className={cn(
                      "h-3 w-3",
                      listing.dealer.isVerified
                        ? "text-[#137A43]"
                        : "text-[#B9B9C4]",
                    )}
                  />
                  {listing.dealer.isVerified
                    ? "Verified dealer"
                    : "Dealer not yet verified"}
                </div>
                {hasServiceHistory && (
                  <div className="flex items-center gap-1.5 text-secondary">
                    <FileText className="h-3 w-3 text-[#8136B2]" />
                    Full service history
                  </div>
                )}
                {inspection ? (
                  <a
                    href="#inspection"
                    className="flex items-center gap-1.5 text-secondary hover:text-[#137A43] transition-colors"
                  >
                    <Sparkles className="h-3 w-3 text-[#137A43]" />
                    <span className="underline decoration-dotted underline-offset-2">
                      {inspection.points}-point inspection report
                    </span>
                  </a>
                ) : (
                  <div className="flex items-center gap-1.5 text-muted">
                    <Sparkles className="h-3 w-3 text-[#B9B9C4]" />
                    Inspection on request
                  </div>
                )}
                {listing.vin && (
                  <div className="flex items-center gap-1.5 text-secondary">
                    <FileText className="h-3 w-3 text-[#8136B2]" />
                    VIN: <span className="font-mono">{listing.vin}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar cars — full-bleed grey band, cars.com style */}
      {similar.length > 0 && (
        <section className="bg-[#F4F4F6] border-t border-[#E5E5EA] py-10 pb-14">
          <div className="mx-auto max-w-7xl px-4 lg:px-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold tracking-tight text-[#141414]">
                {t("similar")}
              </h2>
              <Link
                href={`/buy?make=${encodeURIComponent(listing.make)}`}
                className="text-xs font-semibold text-[#141414] underline underline-offset-2 hover:opacity-70"
              >
                See all {listing.make} cars →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {similar.map((l) => (
                <ListingCard key={l.id} listing={l} locale={loc} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* cars.com-style mobile sticky contact bar */}
      <MobileContactBar priceAED={listing.priceAED} locale={loc} />
    </>
  );
}
