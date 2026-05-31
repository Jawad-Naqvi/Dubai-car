import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import {
  BentoCard,
  BentoTitle,
  BentoDesc,
} from "@/components/marketing/bento-card";
import { MockListingCard } from "@/components/marketing/mock-listing-card";
import { HomeSearch } from "@/components/marketing/home-search";
import { RadialGlow, StarField } from "@/components/marketing/radial-glow";
import {
  Search,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
  Globe,
  BarChart3,
  Ship,
  Users,
  Building2,
  ShoppingBag,
  Plane,
  Mic,
  Network,
  CheckCircle2,
} from "lucide-react";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <>
      {/* ================ HERO ================ */}
      <section className="relative pt-8 pb-12 lg:pt-10 lg:pb-16 overflow-hidden">
        <StarField />
        <RadialGlow color="gold" size="xl" className="-top-40 -right-40" />
        <RadialGlow color="emerald" size="lg" className="-bottom-40 -left-40" />

        <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
          <div className="relative rounded bg-hero-panel ring-1 ring-[#D4AF37]/20 px-5 py-12 lg:px-10 lg:py-16 grain overflow-hidden">
            <RadialGlow color="gold" size="md" className="top-5 right-5 opacity-20" />

            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <Eyebrow tone="gold">{t("hero.eyebrow")}</Eyebrow>
              <h1 className="mt-5 text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.1] text-white">
                {t("hero.title")}
              </h1>
              <p className="mt-4 text-sm lg:text-base text-[#C4D1CB] max-w-xl mx-auto leading-relaxed">
                {t("hero.subtitle")}
              </p>

              {/* AI search bar */}
              <HomeSearch />

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button asChild variant="gold" size="lg">
                  <Link href="/buy">
                    {t("hero.ctaPrimary")}
                    <ArrowRight className="h-3 w-3 rtl-flip" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg">
                  <Link href="/sell">{t("hero.ctaSecondary")}</Link>
                </Button>
              </div>
            </div>

            {/* Floating mock listing cards */}
            <div className="relative z-10 mt-10 grid grid-cols-1 md:grid-cols-3 gap-2.5 max-w-4xl mx-auto">
              <MockListingCard
                title="2023 Toyota Land Cruiser VXR"
                subtitle="6.6L · 18,500 km · GCC"
                priceAED={385000}
                location="Dubai"
                status="verified"
                dealer="Al Futtaim Motors"
                className="md:translate-y-2 animate-float-slow"
              />
              <MockListingCard
                title="2022 Mercedes-Benz G63 AMG"
                subtitle="V8 BiTurbo · 12,200 km · European"
                priceAED={895000}
                location="Abu Dhabi"
                status="export"
                statusLabel="EXPORT READY"
                dealer="Project One Motors"
                className="animate-float-slow [animation-delay:1s]"
              />
              <MockListingCard
                title="2024 Porsche Cayenne Turbo"
                subtitle="V8 · 4,800 km · GCC"
                priceAED={620000}
                location="Sharjah"
                status="new"
                statusLabel="NEW ARRIVAL"
                dealer="Approved Automotive"
                className="md:translate-y-2 animate-float-slow [animation-delay:2s]"
              />
            </div>

            {/* Stats strip */}
            <div className="relative z-10 mt-12 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: "26K+", label: t("hero.stats.listings") },
                { value: "850+", label: t("hero.stats.dealers") },
                { value: "42", label: t("hero.stats.exports") },
                { value: "< 4 min", label: t("hero.stats.responseTime") },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-xl lg:text-2xl font-bold text-gradient-gold">
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-[10px] text-secondary uppercase tracking-wider">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================ BENTO CAPABILITIES ================ */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <RadialGlow color="gold" size="lg" className="top-1/4 -right-40 opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
          <div className="max-w-2xl">
            <Eyebrow tone="gold">{t("bento.eyebrow")}</Eyebrow>
            <h2 className="mt-3 text-xl lg:text-2xl font-bold tracking-tight leading-tight">
              {t("bento.title")}
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-12 gap-3 auto-rows-[180px]">
            {/* Tile 1 */}
            <BentoCard variant="dark" className="col-span-12 md:col-span-7 row-span-2">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <Building2 className="h-5 w-5 text-[#F0CE5C] mb-3" />
                  <BentoTitle>{t("bento.tile1.title")}</BentoTitle>
                  <BentoDesc>{t("bento.tile1.desc")}</BentoDesc>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {["Bulk CSV upload", "Analytics", "Lead inbox", "Subscriptions"].map((c) => (
                    <span
                      key={c}
                      className="text-[10px] px-2 py-0.5 rounded-sm bg-white/5 border border-white/10 text-secondary"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </BentoCard>

            {/* Tile 2 */}
            <BentoCard variant="gold" className="col-span-12 md:col-span-5 row-span-2">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <Sparkles className="h-5 w-5 text-[#1A1208] mb-3" />
                  <BentoTitle className="text-[#1A1208]">{t("bento.tile2.title")}</BentoTitle>
                  <p className="mt-2 text-xs text-[#1A1208]/80 leading-relaxed">
                    {t("bento.tile2.desc")}
                  </p>
                </div>
                <div className="mt-4 space-y-1.5">
                  {[
                    "Red BMW under 80k AED",
                    "2022+ Land Cruiser GCC",
                    "Export-ready Hilux 4x4",
                  ].map((q) => (
                    <div
                      key={q}
                      className="flex items-center gap-1.5 text-[11px] text-[#1A1208] bg-white/40 backdrop-blur rounded-sm px-2.5 py-1 border border-[#1A1208]/10"
                    >
                      <Search className="h-2.5 w-2.5" />
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            </BentoCard>

            <BentoCard variant="dark" className="col-span-12 md:col-span-4">
              <Shield className="h-5 w-5 text-[#F0CE5C] mb-2.5" />
              <BentoTitle>{t("bento.tile3.title")}</BentoTitle>
              <BentoDesc>{t("bento.tile3.desc")}</BentoDesc>
            </BentoCard>

            <BentoCard variant="dark" className="col-span-12 md:col-span-4">
              <BarChart3 className="h-5 w-5 text-[#F0CE5C] mb-2.5" />
              <BentoTitle>{t("bento.tile4.title")}</BentoTitle>
              <BentoDesc>{t("bento.tile4.desc")}</BentoDesc>
            </BentoCard>

            <BentoCard variant="emerald" className="col-span-12 md:col-span-4">
              <Ship className="h-5 w-5 text-[#F0CE5C] mb-2.5" />
              <BentoTitle>{t("bento.tile5.title")}</BentoTitle>
              <p className="mt-2 text-xs text-secondary leading-relaxed">
                {t("bento.tile5.desc")}
              </p>
            </BentoCard>

            <BentoCard variant="dark" className="col-span-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="max-w-xl">
                  <Globe className="h-5 w-5 text-[#F0CE5C] mb-2.5" />
                  <BentoTitle>{t("bento.tile6.title")}</BentoTitle>
                  <BentoDesc>{t("bento.tile6.desc")}</BentoDesc>
                </div>
                <div className="flex flex-wrap gap-1.5 max-w-md md:max-w-xs">
                  {["🇦🇪 AED", "🇺🇸 USD", "🇸🇦 SAR", "EN", "AR", "Dubai", "Abu Dhabi", "Sharjah"].map(
                    (c) => (
                      <span
                        key={c}
                        className="text-[10px] px-2 py-0.5 rounded-sm bg-[#1A1A1A] border border-[#D4AF37]/30 text-[#F0CE5C]"
                      >
                        {c}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* ================ USER TYPES ================ */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#121212]/40 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
          <div className="max-w-2xl">
            <Eyebrow tone="emerald">{t("values.eyebrow")}</Eyebrow>
            <h2 className="mt-3 text-xl lg:text-2xl font-bold tracking-tight leading-tight">
              {t("values.title")}
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Building2, key: 0 },
              { icon: Users, key: 1 },
              { icon: ShoppingBag, key: 2 },
              { icon: Plane, key: 3 },
            ].map(({ icon: Icon, key }) => {
              const item = t.raw(`values.items.${key}`) as {
                title: string;
                desc: string;
              };
              return (
                <div
                  key={key}
                  className="group rounded bg-[#161616] border border-white/8 p-4 hover:border-[#D4AF37]/30 transition-all relative overflow-hidden"
                >
                  <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-[#D4AF37]/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="h-9 w-9 rounded-sm bg-gradient-to-br from-[#D4AF37]/20 to-[#1A1A1A] flex items-center justify-center mb-3 ring-1 ring-[#D4AF37]/30">
                      <Icon className="h-4 w-4 text-[#F0CE5C]" />
                    </div>
                    <h3 className="text-sm font-semibold tracking-tight">{item.title}</h3>
                    <p className="mt-1.5 text-xs text-secondary leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================ ARCHITECTURE ================ */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <RadialGlow color="emerald" size="xl" className="top-0 left-1/2 -translate-x-1/2 opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <Eyebrow tone="gold">From Inventory to Conversion</Eyebrow>
            <h2 className="mt-3 text-xl lg:text-2xl font-bold tracking-tight leading-tight">
              One platform connecting yards, buyers, and importers — across every emirate.
            </h2>
          </div>

          <div className="mt-10 rounded bg-[#121212] border border-white/8 p-5 lg:p-8 grain relative overflow-hidden">
            <RadialGlow color="gold" size="md" className="-top-20 -right-20 opacity-30" />

            <div className="relative grid grid-cols-3 md:grid-cols-5 gap-3 items-center">
              <div className="space-y-2">
                {["Yards", "Dealers", "Private sellers", "Inspection partners"].map((s) => (
                  <div
                    key={s}
                    className="px-3 py-2 rounded-sm bg-[#161616] border border-white/10 text-[10px] text-center text-secondary"
                  >
                    {s}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-[#D4AF37]/40 rtl-flip" />
              </div>

              <div className="relative">
                <div className="aspect-square rounded-sm bg-gradient-to-br from-[#D4AF37] via-[#8C7220] to-[#1A1A1A] p-px">
                  <div className="h-full w-full rounded-[3px] bg-[#0A0A0A] flex flex-col items-center justify-center text-center p-4">
                    <Network className="h-5 w-5 text-[#F0CE5C] mb-2" />
                    <div className="text-[10px] text-secondary uppercase tracking-widest">
                      DXB Motors
                    </div>
                    <div className="text-xs font-bold mt-0.5">Listings · AI · Leads</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-[#D4AF37]/40 rtl-flip" />
              </div>

              <div className="space-y-2">
                {["Local buyers", "B2B importers", "Africa / Asia", "Bulk orders"].map((s) => (
                  <div
                    key={s}
                    className="px-3 py-2 rounded-sm bg-[#161616] border border-white/10 text-[10px] text-center text-secondary"
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================ MARKET STATS ================ */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="max-w-2xl">
            <Eyebrow tone="gold">{t("market.eyebrow")}</Eyebrow>
            <h2 className="mt-3 text-xl lg:text-2xl font-bold tracking-tight leading-tight">
              {t("market.title")}
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => {
              const stat = t.raw(`market.stats.${i}`) as {
                value: string;
                label: string;
                source: string;
              };
              return (
                <div
                  key={i}
                  className="rounded bg-bento-dark border border-white/8 p-5 relative overflow-hidden grain"
                >
                  <TrendingUp className="h-4 w-4 text-[#F0CE5C] mb-3" />
                  <div className="text-2xl lg:text-3xl font-bold text-gradient-gold leading-none">
                    {stat.value}
                  </div>
                  <div className="mt-2.5 text-xs text-secondary leading-relaxed">
                    {stat.label}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5 text-[9px] text-muted uppercase tracking-wider">
                    {stat.source}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================ VOICE / AI BAND ================ */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <BentoCard variant="dark" className="lg:row-span-2 min-h-[320px]">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <Eyebrow tone="gold">AI CONCIERGE</Eyebrow>
                  <h3 className="mt-3 text-lg lg:text-xl font-bold tracking-tight leading-snug">
                    Tell our AI what car you want. It does the searching.
                  </h3>
                  <p className="mt-2.5 text-secondary text-xs leading-relaxed">
                    Voice or text — in English or Arabic — describe what you want, your budget,
                    where you are. Our concierge surfaces matching cars, schedules viewings,
                    and routes WhatsApp messages to dealers automatically.
                  </p>
                </div>
                <ul className="mt-4 space-y-2">
                  {[
                    "Bilingual EN / AR natural language",
                    "Saved searches with alerts",
                    "Price-drop notifications",
                    "WhatsApp lead routing",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-secondary">
                      <CheckCircle2 className="h-3 w-3 text-[#F0CE5C]" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </BentoCard>

            <BentoCard variant="gold" className="min-h-[152px]">
              <div className="flex items-center gap-4 h-full">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
                  <div className="absolute inset-3 rounded-full bg-white/40 animate-ping [animation-delay:0.5s]" />
                  <div className="relative h-14 w-14 rounded-full bg-white flex items-center justify-center">
                    <Mic className="h-5 w-5 text-[#1A1208]" />
                  </div>
                </div>
                <div className="text-[#1A1208]">
                  <div className="text-[10px] uppercase tracking-widest font-bold opacity-70">
                    Voice search
                  </div>
                  <div className="mt-0.5 text-sm font-bold">
                    &ldquo;White Patrol under 200k, GCC.&rdquo;
                  </div>
                </div>
              </div>
            </BentoCard>

            <BentoCard variant="emerald" className="min-h-[152px]">
              <div className="h-full flex flex-col justify-between">
                <Globe className="h-5 w-5 text-[#F0CE5C]" />
                <div>
                  <div className="text-2xl font-bold text-gradient-gold">42</div>
                  <p className="mt-1.5 text-xs text-secondary">
                    Countries we ship to — RoRo and container, partner-managed.
                  </p>
                </div>
              </div>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* ================ FINAL CTA ================ */}
      <section className="relative pt-8 pb-20 overflow-hidden">
        <RadialGlow color="gold" size="xl" className="-top-40 left-1/2 -translate-x-1/2 opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
          <div className="rounded bg-hero-panel ring-1 ring-[#D4AF37]/25 px-5 py-12 lg:px-10 lg:py-14 text-center grain relative overflow-hidden">
            <RadialGlow color="gold" size="md" className="-bottom-20 -left-20 opacity-40" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <Eyebrow tone="gold">{t("cta.eyebrow")}</Eyebrow>
              <h2 className="mt-4 text-xl lg:text-2xl font-bold tracking-tight leading-tight">
                {t("cta.title")}
              </h2>
              <p className="mt-3 text-sm text-secondary">{t("cta.subtitle")}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button asChild variant="gold" size="lg">
                  <Link href="/contact">{t("cta.primary")}</Link>
                </Button>
                <Button asChild variant="ghost" size="lg">
                  <Link href="/pricing">{t("cta.secondary")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
