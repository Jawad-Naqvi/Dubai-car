import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { BentoCard, BentoTitle, BentoDesc } from "@/components/marketing/bento-card";
import { RadialGlow, StarField } from "@/components/marketing/radial-glow";
import { ListingCard } from "@/components/listings/listing-card";
import { searchListings } from "@/lib/data/listings";
import {
  Ship,
  FileText,
  Globe,
  Truck,
  ShieldCheck,
  ArrowRight,
  Building2,
  Package,
  ClipboardCheck,
  Boxes,
} from "lucide-react";

const destinations = [
  { country: "Nigeria", flag: "🇳🇬", cars: 4820 },
  { country: "Ghana", flag: "🇬🇭", cars: 2150 },
  { country: "Kenya", flag: "🇰🇪", cars: 1980 },
  { country: "Tanzania", flag: "🇹🇿", cars: 1740 },
  { country: "South Africa", flag: "🇿🇦", cars: 1620 },
  { country: "Zambia", flag: "🇿🇲", cars: 980 },
  { country: "Pakistan", flag: "🇵🇰", cars: 880 },
  { country: "Uganda", flag: "🇺🇬", cars: 720 },
];

const docs = [
  { icon: FileText, title: "Title document", desc: "Original ownership transfer paperwork." },
  { icon: ClipboardCheck, title: "Export certificate", desc: "Issued by RTA, certifies vehicle for export." },
  { icon: FileText, title: "RTA deregistration", desc: "Removes the vehicle from UAE local registration." },
  { icon: Package, title: "Inspection report", desc: "Optional independent 240-point report." },
];

export default async function ExportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("export");

  const exportListings = (
    await searchListings({ exportReady: true, perPage: 8 })
  ).items;

  return (
    <>
      {/* HERO */}
      <section className="relative pt-12 pb-24 lg:pt-16 overflow-hidden">
        <StarField />
        <RadialGlow color="gold" size="xl" className="-top-40 -right-40" />
        <RadialGlow color="emerald" size="lg" className="-bottom-40 -left-40" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-6">
          <div className="relative rounded bg-hero-panel ring-1 ring-[#C8A93E]/30 px-5 py-8 lg:px-6 lg:py-10 grain overflow-hidden">
            <div className="relative z-10 max-w-4xl">
              <Eyebrow tone="gold">{t("eyebrow")}</Eyebrow>
              <h1 className="mt-6 text-sm lg:text-2xl font-bold tracking-tight leading-[1.05]">
                {t("title")}
              </h1>
              <p className="mt-6 text-sm lg:text-sm text-secondary max-w-2xl leading-relaxed">
                {t("subtitle")}
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <Button asChild variant="gold" size="lg">
                  <Link href="/export/register">
                    {t("registerB2B")}
                    <ArrowRight className="h-4 w-4 rtl-flip" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg">
                  <Link href="#export-inventory">{t("requestBulkQuote")}</Link>
                </Button>
              </div>
            </div>

            {/* Destinations grid */}
            <div className="relative z-10 mt-16">
              <Eyebrow tone="gold" className="mb-5">
                {t("destinations")}
              </Eyebrow>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {destinations.map((d) => (
                  <div
                    key={d.country}
                    className="rounded-lg bg-white border border-[#E5E5E5] p-4 text-center hover:border-[#C8A93E]/40 transition-colors"
                  >
                    <div className="text-2xl mb-2">{d.flag}</div>
                    <div className="text-xs text-[#1A1A1A] font-semibold">
                      {d.country}
                    </div>
                    <div className="mt-1 text-[10px] text-muted">
                      {d.cars.toLocaleString()} cars
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS BENTO */}
      <section className="relative py-10 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-6">
          <div className="max-w-3xl">
            <Eyebrow tone="gold">HOW IT WORKS</Eyebrow>
            <h2 className="mt-4 text-sm lg:text-sm font-bold tracking-tight leading-[1.1]">
              From verified buyer to vehicle shipped — in one workflow.
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-12 gap-5 auto-rows-[240px]">
            <BentoCard variant="dark" className="col-span-12 md:col-span-4">
              <div className="text-[10px] uppercase tracking-widest text-[#C8A93E]/70 mb-3">
                Step 01
              </div>
              <Building2 className="h-7 w-7 text-[#C8A93E] mb-4" />
              <BentoTitle className="text-sm">Register as a B2B buyer</BentoTitle>
              <BentoDesc className="text-sm mt-2">
                Upload your trade licence. Our team verifies in under 24 hours.
              </BentoDesc>
            </BentoCard>

            <BentoCard variant="dark" className="col-span-12 md:col-span-4">
              <div className="text-[10px] uppercase tracking-widest text-[#C8A93E]/70 mb-3">
                Step 02
              </div>
              <Boxes className="h-7 w-7 text-[#C8A93E] mb-4" />
              <BentoTitle className="text-sm">Browse export-ready stock</BentoTitle>
              <BentoDesc className="text-sm mt-2">
                Filter by destination country, model, and quantity. Bulk-select up to 50.
              </BentoDesc>
            </BentoCard>

            <BentoCard variant="emerald" className="col-span-12 md:col-span-4">
              <div className="text-[10px] uppercase tracking-widest text-[#C8A93E]/80 mb-3">
                Step 03
              </div>
              <Ship className="h-7 w-7 text-[#C8A93E] mb-4" />
              <BentoTitle className="text-sm">Ship — RoRo or container</BentoTitle>
              <BentoDesc className="text-sm mt-2">
                Coordinated through approved freight partners ex Jebel Ali.
              </BentoDesc>
            </BentoCard>

            <BentoCard variant="gold" className="col-span-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 h-full">
                <div className="max-w-xl">
                  <Truck className="h-7 w-7 text-white mb-4" />
                  <BentoTitle className="text-white">
                    RoRo to Africa: ~AED 2,000–3,500 per vehicle.
                  </BentoTitle>
                  <p className="mt-3 text-white/80">
                    Jebel Ali — the largest port in MENA — gives us direct routes
                    to Mombasa, Dar es Salaam, Lagos, and Karachi.
                  </p>
                </div>
                <Button asChild variant="dark" size="lg">
                  <Link href="/contact">Talk to our export team</Link>
                </Button>
              </div>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* DOCS PANEL */}
      <section className="relative py-10 overflow-hidden">
        <RadialGlow color="gold" size="lg" className="-top-20 -left-20 opacity-20" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-6">
          <div className="max-w-3xl">
            <Eyebrow tone="gold">DOCUMENTATION</Eyebrow>
            <h2 className="mt-4 text-sm font-bold tracking-tight leading-[1.1]">
              Every document buyers need — coordinated with the seller.
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {docs.map((d) => (
              <div
                key={d.title}
                className="rounded-xl bg-white border border-[#E5E5E5] shadow-card p-6 hover:shadow-card-hover hover:border-[#C8A93E]/30 transition-colors"
              >
                <d.icon className="h-6 w-6 text-[#C8A93E] mb-4" />
                <h3 className="text-sm font-semibold">{d.title}</h3>
                <p className="mt-2 text-xs text-secondary leading-relaxed">
                  {d.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPORT INVENTORY */}
      <section id="export-inventory" className="relative py-10 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-6">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <Eyebrow tone="gold">EXPORT-READY INVENTORY</Eyebrow>
              <h2 className="mt-4 text-sm lg:text-sm font-bold tracking-tight">
                Hand-picked cars cleared for export
              </h2>
            </div>
            <Button asChild variant="gold_outline" size="md">
              <Link href="/buy?exportReady=true">Browse all →</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {exportListings.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                locale={locale as "en" | "ar"}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-6">
          <div className="rounded bg-hero-panel ring-1 ring-[#C8A93E]/30 px-5 py-8 lg:px-6 lg:py-8 text-center grain relative overflow-hidden">
            <RadialGlow color="gold" size="md" className="-top-20 -right-20 opacity-40" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <ShieldCheck className="h-10 w-10 text-[#C8A93E] mx-auto mb-6" />
              <h2 className="text-sm lg:text-sm font-bold tracking-tight">
                Ready to source UAE inventory at scale?
              </h2>
              <p className="mt-6 text-secondary text-sm">
                Bulk orders, dedicated account manager, container or RoRo. We
                handle the connection — yards handle the rest.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild variant="gold" size="xl">
                  <Link href="/export/register">Register as B2B buyer</Link>
                </Button>
                <Button asChild variant="ghost" size="xl">
                  <Link href="/contact">Talk to sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
