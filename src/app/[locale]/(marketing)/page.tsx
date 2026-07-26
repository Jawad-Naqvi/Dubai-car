import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { mockListings } from "@/lib/mock-data";
import { formatAED } from "@/lib/utils";
import { carImageUrl } from "@/lib/car-images";
import { Reveal } from "@/components/marketing/home/reveal";
import { HomeSearchTabs } from "@/components/marketing/home-search-tabs";
import { PromoCard } from "@/components/marketing/home/promo-card";
import { WhyAccordion } from "@/components/marketing/home/why-accordion";
import { TopCarousel, type TopCar } from "@/components/marketing/home/top-carousel";
import { Testimonials, type Testimonial } from "@/components/marketing/home/testimonials";
import { ArrowUpRight, BadgeCheck, Ship, ShieldCheck, Star } from "lucide-react";

const TINTS = [
  "bg-[#F3EDF9]",
  "bg-[#CFE3F3]",
  "bg-[#DFEDE0]",
  "bg-[#E6E1F2]",
  "bg-[#F3EDF9]",
  "bg-[#F4F4F6]",
];

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const loc = locale === "ar" ? "ar" : "en";

  const promos = t.raw("hero.promos") as { label: string; cta: string; href: string }[];
  const whyItems = t.raw("why.items") as { q: string; a: string }[];
  const values = t.raw("values") as { title: string; desc: string; cta: string; href: string }[];
  const categories = t.raw("all.categories") as string[];
  const clients = t.raw("clients.items") as Testimonial[];

  /* Hero promo art — resolved through the car-image provider chain
     (IMAGIN.studio render when configured, else the listing's stored photo). */
  const promoSources = [
    mockListings.find((l) => l.model.includes("G63")) ?? mockListings[1],
    mockListings.find((l) => l.model.includes("Land Cruiser")) ?? mockListings[0],
    mockListings.find((l) => l.model.includes("Hilux")) ?? mockListings[2],
  ];
  const promoImages = promoSources.map((l) =>
    carImageUrl({ make: l.make, model: l.model, year: l.year, angle: "01", fallbackUrl: l.imageUrl }),
  );

  const topCars: TopCar[] = mockListings.slice(0, 8).map((l, i) => ({
    id: l.id,
    slug: l.slug,
    name: `${l.make} ${l.model}`,
    priceLabel: formatAED(l.priceAED, loc),
    rating: 3.9 + ((i * 3) % 10) / 10,
    image: carImageUrl({ make: l.make, model: l.model, year: l.year, fallbackUrl: l.imageUrl }),
    tint: TINTS[i % TINTS.length],
  }));

  const gridCars = mockListings.slice(2, 8);
  const categoryValues = ["SUV", "Sedan", "Coupe", "Pickup"];

  const whyImage = carImageUrl({
    make: "Land Rover",
    model: "Range Rover",
    angle: "09",
    fallbackUrl: mockListings.find((l) => l.make === "Land Rover")?.imageUrl,
  });
  const offerSource = mockListings.find((l) => l.model.includes("Patrol")) ?? mockListings[3];
  const collectionSource = mockListings.find((l) => l.make === "Lexus") ?? mockListings[4];

  return (
    <>
      {/* ================ HERO — grey band, search column left (cars.com) ================ */}
      <section className="bg-[#F4F4F6] border-b border-[#E5E5EA]">
        <div className="mx-auto max-w-7xl px-4 lg:px-6 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[430px_1fr] gap-10 lg:gap-16 items-start">
            {/* Search column */}
            <div>
              <Reveal>
                <h1 className="text-3xl sm:text-4xl lg:text-[40px] leading-[1.1] tracking-tight font-extrabold text-[#141414]">
                  {t("hero.titlePre")} {t("hero.titleHighlight")}{" "}
                  {t("hero.titlePost")}
                </h1>
              </Reveal>

              {/* Shop / Sell switcher — buyers search, sellers get a valuation */}
              <Reveal delay={0.15} className="mt-6">
                <HomeSearchTabs />
              </Reveal>
            </div>

            {/* Hero art */}
            <Reveal delay={0.2} className="relative hidden lg:block self-stretch min-h-[430px]">
              <div className="absolute inset-0 rounded-lg overflow-hidden bg-[#E6E1F2]">
                <Image
                  src={promoImages[0]}
                  alt={promos[0]?.label ?? "Featured car"}
                  fill
                  sizes="(max-width: 1024px) 0px, 60vw"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute bottom-4 right-4">
                <Button asChild variant="dark" size="sm" className="rounded-full">
                  <Link href="/buy">{t("hero.contact")}</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================ PROMO CARDS ================ */}
      <section className="relative pt-10 lg:pt-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {promos.map((p, i) => (
              <PromoCard
                key={p.href}
                image={promoImages[i]}
                label={p.label}
                cta={p.cta}
                href={p.href}
                alt={p.label}
                listingId={promoSources[i]?.id}
                delay={0.1 + i * 0.12}
              />
            ))}
          </div>

          {/* Featured divider */}
          <Reveal className="mt-12 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#141414]/15" />
            <span className="inline-flex items-center rounded-full border border-[#141414]/20 px-4 py-1.5 text-xs font-semibold text-[#141414]">
              {t("featuredWork")}
            </span>
            <Link
              href="/buy"
              aria-label="Browse inventory"
              className="h-9 w-9 rounded-full border border-[#141414]/20 flex items-center justify-center text-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
            >
              <ArrowUpRight className="h-4 w-4 rtl-flip" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ================ TOP SELLING ================ */}
      <section className="relative pt-16 lg:pt-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <Reveal>
            <Link
              href="/buy"
              className="inline-flex items-center rounded-full border border-[#141414]/20 px-4 py-1.5 text-xs font-semibold text-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
            >
              {t("topSelling.chip")}
            </Link>
          </Reveal>
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-end">
            <Reveal delay={0.05}>
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] leading-[1.1] tracking-tight font-bold text-[#141414] max-w-xl">
                {t("topSelling.title")}
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="text-xs text-secondary leading-relaxed">{t("topSelling.note")}</p>
              <Button asChild variant="gold" size="md" className="mt-4">
                <Link href="/buy">{t("topSelling.cta")}</Link>
              </Button>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="mt-8">
            <TopCarousel cars={topCars} />
          </Reveal>
        </div>
      </section>

      {/* ================ WHY CHOOSE US ================ */}
      <section className="relative pt-12 lg:pt-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Reveal className="relative min-h-[320px] lg:min-h-[460px] rounded-2xl overflow-hidden bg-[#CFE3F3]">
              <Image
                src={whyImage}
                alt="Verified inspection"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/95 backdrop-blur px-4 py-2 text-xs font-semibold text-[#141414] shadow-card">
                <BadgeCheck className="h-4 w-4 text-[#8136B2]" />
                200-point inspection
              </div>
            </Reveal>

            <Reveal delay={0.12} className="rounded-2xl bg-white shadow-card p-6 lg:p-10">
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#141414]">
                {t("why.title")}
              </h2>
              <p className="mt-3 text-xs lg:text-sm text-secondary leading-relaxed max-w-md">
                {t("why.desc")}
              </p>
              <div className="mt-6">
                <WhyAccordion items={whyItems} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================ VALUE PROPS + OFFER TILE ================ */}
      <section className="relative pt-12 lg:pt-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {values.map((v, i) => (
              <Reveal
                key={v.title}
                delay={i * 0.1}
                className={`rounded-2xl p-6 flex flex-col ${
                  i === 0 ? "bg-[#F3EDF9]" : "bg-white shadow-card"
                }`}
              >
                <div className="h-9 w-9 rounded-full bg-[#141414] text-white flex items-center justify-center mb-4">
                  {i === 0 ? (
                    <BadgeCheck className="h-4 w-4" />
                  ) : i === 1 ? (
                    <Ship className="h-4 w-4" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                </div>
                <h3 className="text-base font-bold text-[#141414] leading-snug">{v.title}</h3>
                <p className="mt-2 text-xs text-secondary leading-relaxed flex-1">{v.desc}</p>
                <Button asChild variant="gold_outline" size="sm" className="mt-5 self-start">
                  <Link href={v.href}>{v.cta}</Link>
                </Button>
              </Reveal>
            ))}

            {/* Offer tile with starburst */}
            <Reveal
              delay={0.3}
              className="relative rounded-2xl overflow-hidden min-h-[220px] bg-[#C6CD87]"
            >
              <Image
                src={carImageUrl({
                  make: offerSource.make,
                  model: offerSource.model,
                  year: offerSource.year,
                  fallbackUrl: offerSource.imageUrl,
                })}
                alt={`${t("offer.line1")} ${t("offer.line2")}`}
                fill
                sizes="(max-width: 768px) 100vw, 25vw"
                className="object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-[#141414]/35" />
              <div className="absolute top-4 right-4 starburst h-16 w-16 bg-[#F04E23] text-white flex items-center justify-center text-[10px] font-extrabold text-center leading-tight animate-spin-slow">
                {t("offer.discount")}
              </div>
              <div className="absolute bottom-5 left-5 text-white">
                <div className="text-2xl font-extrabold leading-tight">{t("offer.line1")}</div>
                <div className="text-2xl font-light leading-tight">{t("offer.line2")}</div>
              </div>
              <Link
                href="/export"
                aria-label={`${t("offer.line1")} ${t("offer.line2")}`}
                className="absolute inset-0"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================ COLLECTION BANNER ================ */}
      <section className="relative pt-12 lg:pt-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <Reveal className="relative rounded-[2rem] bg-[#F3EDF9] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center">
              <div className="p-8 lg:p-14">
                <h2 className="text-3xl lg:text-[44px] leading-[1.1] font-bold tracking-tight text-[#141414] max-w-sm">
                  {t("collection.title")}
                </h2>
                <p className="mt-4 text-xs lg:text-sm text-secondary max-w-xs leading-relaxed">
                  {t("collection.desc")}
                </p>
                <Button asChild variant="gold" size="lg" className="mt-6">
                  <Link href="/buy?bodyType=SUV">{t("collection.cta")}</Link>
                </Button>
              </div>
              <div className="relative h-64 lg:h-[420px]">
                <div className="absolute right-8 top-1/2 -translate-y-1/2 h-48 w-48 lg:h-80 lg:w-80 rounded-full bg-[#CFE3F3]" />
                <div className="absolute inset-4 lg:inset-8 animate-float-slow">
                  <Image
                    src={carImageUrl({
                      make: collectionSource.make,
                      model: collectionSource.model,
                      year: collectionSource.year,
                      fallbackUrl: collectionSource.imageUrl,
                    })}
                    alt={t("collection.title")}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover rounded-2xl shadow-card-hover"
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================ ALL CARS GRID ================ */}
      <section className="relative pt-12 lg:pt-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <Reveal>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-[#141414]">
              {t("all.title")}
            </h2>
            <p className="mt-2 text-xs text-secondary max-w-sm leading-relaxed">{t("all.desc")}</p>
          </Reveal>

          <Reveal delay={0.1} className="mt-6 flex flex-wrap gap-2">
            {categories.map((cat, i) => (
              <Link
                key={cat}
                href={`/buy?bodyType=${encodeURIComponent(categoryValues[i] ?? cat)}`}
                className="inline-flex items-center rounded-full border border-[#141414]/20 px-4 py-1.5 text-xs font-semibold text-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
              >
                {cat}
              </Link>
            ))}
          </Reveal>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {gridCars.map((l, i) => (
              <Reveal key={l.id} delay={(i % 3) * 0.08}>
                <Link href={`/listings/${l.id}/${l.slug}`} className="group block">
                  <div
                    className={`relative aspect-[4/3] rounded-2xl overflow-hidden ${TINTS[(i + 1) % TINTS.length]}`}
                  >
                    <Image
                      src={carImageUrl({
                        make: l.make,
                        model: l.model,
                        year: l.year,
                        fallbackUrl: l.imageUrl,
                      })}
                      alt={`${l.year} ${l.make} ${l.model}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#141414] truncate">
                        {l.year} {l.make} {l.model}
                      </div>
                      <div className="mt-1 flex gap-0.5">
                        {[0, 1, 2, 3, 4].map((s) => (
                          <Star
                            key={s}
                            className={`h-3 w-3 ${
                              s < 4
                                ? "fill-[#8136B2] text-[#8136B2]"
                                : "fill-[#E5E5EA] text-[#E5E5EA]"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[#141414] whitespace-nowrap">
                      {formatAED(l.priceAED, loc)}
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================ TESTIMONIALS ================ */}
      <section className="relative pt-12 lg:pt-16 pb-8">
        <div className="mx-auto max-w-4xl px-4 lg:px-6">
          <Reveal>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-[#141414] text-center">
              {t("clients.title")}
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-8">
            <Testimonials items={clients} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
