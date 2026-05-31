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
import { formatAED, formatKm, monthlyEMI } from "@/lib/utils";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { FinanceCalculator } from "@/components/listings/finance-calculator";
import { SaveButton } from "@/components/listings/save-button";
import { ExportQuoteButton } from "@/components/listings/export-quote-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ListingCard } from "@/components/listings/listing-card";
import { ContactPaywall } from "@/components/listings/paywall";
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
        <div className="border-b border-white/5 bg-[#121212]/40 relative">
          <div className="mx-auto max-w-7xl px-4 lg:px-6 py-2 overflow-x-auto whitespace-nowrap flex items-center gap-1.5 text-[10px] text-muted">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/buy" className="hover:text-white">Buy</Link>
            <span>/</span>
            <Link href={`/buy?make=${listing.make}`} className="hover:text-white">
              {listing.make}
            </Link>
            <span>/</span>
            <span className="text-white">{listingTitle}</span>
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
                  <div className="text-xl lg:text-2xl font-bold text-gradient-gold leading-none">
                    {formatAED(listing.priceAED, locale as "en" | "ar")}
                  </div>
                  <div className="mt-1 text-[10px] text-muted">
                    From {formatAED(emi, locale as "en" | "ar")} / month
                  </div>
                </div>
              </div>

              {/* Specs grid */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider">{t("specs")}</h2>
                  <div className="h-px bg-white/5 flex-1" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {specs.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-sm bg-[#161616] border border-white/8 p-2.5"
                    >
                      <s.icon className="h-3 w-3 text-[#F0CE5C] mb-2" />
                      <div className="text-[9px] text-muted uppercase tracking-wider">
                        {s.label}
                      </div>
                      <div className="mt-0.5 text-xs font-semibold text-white truncate">
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
                  <div className="h-px bg-white/5 flex-1" />
                </div>
                <p className="text-xs text-secondary leading-relaxed">
                  {listing.description}
                </p>
              </div>

              {/* Features */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider">{t("features")}</h2>
                  <div className="h-px bg-white/5 flex-1" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {listing.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 rounded-sm bg-[#161616] border border-white/8 px-3 py-2"
                    >
                      <CheckCircle2 className="h-3 w-3 text-[#F0CE5C]" />
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
              <div className="rounded bg-bento-dark border border-white/8 p-4 grain relative overflow-hidden">
                <div className="flex items-start gap-2.5">
                  <div className="h-10 w-10 rounded-sm bg-gradient-to-br from-[#D4AF37] to-[#8C7220] flex items-center justify-center text-[#1A1208] font-bold text-sm flex-shrink-0">
                    {listing.dealer.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold text-xs truncate">{listing.dealer.name}</h3>
                      {listing.dealer.isVerified && (
                        <BadgeCheck className="h-3 w-3 text-[#F0CE5C] flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-secondary mt-0.5">
                      <Star className="h-2.5 w-2.5 fill-[#F0CE5C] text-[#F0CE5C]" />
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
                  />
                </div>

                <Link
                  href={`/dealers/${listing.dealer.slug}`}
                  className="mt-2 flex items-center justify-center gap-1 h-7 w-full text-[10px] text-secondary hover:text-[#F0CE5C] transition-colors"
                >
                  View storefront →
                </Link>
              </div>

              {/* Export panel */}
              {listing.isExportReady && (
                <div className="rounded bg-[#1A1A1A] border border-[#D4AF37]/30 p-4 relative overflow-hidden">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Ship className="h-3.5 w-3.5 text-[#F0CE5C]" />
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

              {/* Trust strip */}
              <div className="rounded bg-[#161616] border border-white/8 p-3">
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-secondary">
                    <ShieldCheck className="h-3 w-3 text-[#F0CE5C]" />
                    Verified dealer
                  </div>
                  <div className="flex items-center gap-1.5 text-secondary">
                    <FileText className="h-3 w-3 text-[#F0CE5C]" />
                    Full service history
                  </div>
                  <div className="flex items-center gap-1.5 text-secondary">
                    <Sparkles className="h-3 w-3 text-[#D4AF37]" />
                    Inspection on request
                  </div>
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
                  className="text-xs text-[#F0CE5C] hover:underline"
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
