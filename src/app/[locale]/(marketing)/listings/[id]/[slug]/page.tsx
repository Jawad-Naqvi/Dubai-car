import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getListingById,
  getSimilarListings,
  getListingMedia,
  incrementViewCount,
} from "@/lib/data/listings";
import { formatAED, formatKm, monthlyEMI, cn } from "@/lib/utils";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { FinanceCalculator } from "@/components/listings/finance-calculator";
import { SaveButton } from "@/components/listings/save-button";
import { ExportQuoteButton } from "@/components/listings/export-quote-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ListingCard } from "@/components/listings/listing-card";
import { ContactPaywall } from "@/components/listings/paywall";
import { DealBadge } from "@/components/listings/deal-badge";
import { ReportListingButton } from "@/components/listings/report-listing-button";
import { RadialGlow } from "@/components/marketing/radial-glow";
import {
  Heart,
  Share2,
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
  Star,
  Calculator,
  Ship,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://dxbmotors.ae";

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
  const [similar, media] = await Promise.all([
    getSimilarListings(listing, 4),
    getListingMedia(id),
  ]);
  // fire-and-forget view counter (no-op when DB is off)
  void incrementViewCount(id);

  const gallery = media.length > 0 ? media : [listing.imageUrl];
  const emi = monthlyEMI(listing.priceAED);
  const listingTitle = `${listing.year} ${listing.make} ${listing.model}`;
  // "Service history" is a real signal only when the seller listed it as a feature.
  const hasServiceHistory = (listing.features ?? []).some((f) =>
    /service history|full history|dealer history/i.test(f),
  );

  const specs = [
    { icon: Calendar, label: t("year"), value: listing.year },
    { icon: Gauge, label: t("km"), value: formatKm(listing.kms, locale as "en" | "ar") },
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

      <div className="relative overflow-hidden">
        <RadialGlow color="gold" size="xl" className="-top-40 -right-40 opacity-15" />

        {/* Breadcrumb */}
        <div className="border-b border-[#E7E4DA] bg-white relative">
          <div className="mx-auto max-w-7xl px-4 lg:px-6 py-2 overflow-x-auto whitespace-nowrap flex items-center gap-1.5 text-[10px] text-muted">
            <Link href="/" className="hover:text-[#141414]">Home</Link>
            <span>/</span>
            <Link href="/buy" className="hover:text-[#141414]">Buy</Link>
            <span>/</span>
            <Link href={`/buy?make=${listing.make}`} className="hover:text-[#141414]">
              {listing.make}
            </Link>
            <span>/</span>
            <span className="text-[#141414]">{listingTitle}</span>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
            {/* LEFT */}
            <div className="min-w-0">
              {/* Gallery */}
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

              {/* Title + price */}
              <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Eyebrow tone="gold">{listing.regionalSpec} SPEC</Eyebrow>
                  <h1 className="mt-2 text-xl lg:text-2xl font-bold tracking-tight leading-tight">
                    {listingTitle}
                  </h1>
                  {listing.trim && (
                    <p className="mt-1 text-xs text-secondary">{listing.trim}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="text-xl lg:text-2xl font-bold text-[#141414] leading-none">
                      {formatAED(listing.priceAED, locale as "en" | "ar")}
                    </div>
                    <DealBadge rating={listing.dealRating} />
                  </div>
                  {listing.previousPrice ? (
                    <div className="mt-1 flex items-center justify-end gap-1.5">
                      <span className="text-[11px] text-muted line-through">
                        {formatAED(listing.previousPrice, locale as "en" | "ar")}
                      </span>
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-[#137A43] text-white px-1.5 py-0.5 text-[10px] font-semibold">
                        {formatAED(listing.previousPrice - listing.priceAED, locale as "en" | "ar")} price drop
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 text-[10px] text-muted">
                      From {formatAED(emi, locale as "en" | "ar")} / month
                    </div>
                  )}
                </div>
              </div>

              {/* Specs grid */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider">{t("specs")}</h2>
                  <div className="h-px bg-[#E7E4DA] flex-1" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {specs.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl bg-white border border-[#E7E4DA] shadow-card p-2.5"
                    >
                      <s.icon className="h-3 w-3 text-[#F0941F] mb-2" />
                      <div className="text-[9px] text-muted uppercase tracking-wider">
                        {s.label}
                      </div>
                      <div className="mt-0.5 text-xs font-semibold text-[#141414] truncate">
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider">{t("description")}</h2>
                  <div className="h-px bg-[#E7E4DA] flex-1" />
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  {listing.description}
                </p>
              </div>

              {/* Features */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider">{t("features")}</h2>
                  <div className="h-px bg-[#E7E4DA] flex-1" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {listing.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 rounded-xl bg-white border border-[#E7E4DA] shadow-card px-3 py-2"
                    >
                      <CheckCircle2 className="h-3 w-3 text-[#F0941F]" />
                      <span className="text-xs">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Finance calculator */}
              <FinanceCalculator
                price={listing.priceAED}
                locale={locale as "en" | "ar"}
                className="mt-6"
              />
            </div>

            {/* RIGHT — Sticky paywall + dealer */}
            <div className="lg:sticky lg:top-16 lg:self-start space-y-3">
              {/* Dealer card */}
              <div className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-4 relative overflow-hidden">
                <div className="flex items-start gap-2.5">
                  <div className="h-10 w-10 rounded-full bg-[#181C30] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {listing.dealer.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold text-xs truncate">{listing.dealer.name}</h3>
                      {listing.dealer.isVerified && (
                        <BadgeCheck className="h-3 w-3 text-[#F0941F] flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-secondary mt-0.5">
                      <Star className="h-2.5 w-2.5 fill-[#F0941F] text-[#F0941F]" />
                      {listing.dealer.rating} · {listing.dealer.reviewCount} reviews
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted mt-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      {listing.emirate}, UAE
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <ContactPaywall
                    listingId={listing.id}
                    listingTitle={listingTitle}
                    dealerPhone={listing.dealer.phone}
                    dealerWhatsapp={listing.dealer.whatsapp}
                  />
                </div>

                <Link
                  href={`/dealers/${listing.dealer.slug}`}
                  className="mt-2 flex items-center justify-center gap-1 h-7 w-full text-[10px] text-secondary hover:text-[#141414] transition-colors"
                >
                  View storefront →
                </Link>
                <div className="mt-2 flex justify-center">
                  <ReportListingButton listingId={listing.id} />
                </div>
              </div>

              {/* Export panel */}
              {listing.isExportReady && (
                <div className="rounded-2xl bg-[#FBE7D4] border border-[#E7E4DA] shadow-card p-4 relative overflow-hidden">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Ship className="h-3.5 w-3.5 text-[#F0941F]" />
                    <Eyebrow tone="gold">EXPORT READY</Eyebrow>
                  </div>
                  <h3 className="text-sm font-semibold">Ship worldwide</h3>
                  <p className="mt-1.5 text-[11px] text-secondary leading-relaxed">
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
              <div className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-3">
                <div className="space-y-1.5 text-[11px]">
                  <div
                    className={cn(
                      "flex items-center gap-1.5",
                      listing.dealer.isVerified
                        ? "text-secondary"
                        : "text-muted",
                    )}
                  >
                    <ShieldCheck
                      className={cn(
                        "h-3 w-3",
                        listing.dealer.isVerified
                          ? "text-[#137A43]"
                          : "text-[#B8B2A0]",
                      )}
                    />
                    {listing.dealer.isVerified
                      ? "Verified dealer"
                      : "Dealer not yet verified"}
                  </div>
                  {hasServiceHistory && (
                    <div className="flex items-center gap-1.5 text-secondary">
                      <FileText className="h-3 w-3 text-[#F0941F]" />
                      Full service history
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex items-center gap-1.5",
                      listing.isInspected ? "text-secondary" : "text-muted",
                    )}
                  >
                    <Sparkles
                      className={cn(
                        "h-3 w-3",
                        listing.isInspected ? "text-[#137A43]" : "text-[#B8B2A0]",
                      )}
                    />
                    {listing.isInspected
                      ? "Inspection report available"
                      : "Inspection on request"}
                  </div>
                  {listing.vin && (
                    <div className="flex items-center gap-1.5 text-secondary">
                      <FileText className="h-3 w-3 text-[#F0941F]" />
                      VIN: <span className="font-mono">{listing.vin}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Similar */}
          {similar.length > 0 && (
            <div className="mt-16">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <Eyebrow tone="gold">SIMILAR CARS</Eyebrow>
                  <h2 className="mt-2 text-lg lg:text-xl font-bold tracking-tight">
                    {t("similar")}
                  </h2>
                </div>
                <Link
                  href="/buy"
                  className="text-xs font-semibold text-[#141414] underline underline-offset-2 hover:opacity-70"
                >
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {similar.map((l) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    locale={locale as "en" | "ar"}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
