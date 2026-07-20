import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { getCatalogMakes, getCatalogModels } from "@/lib/data/catalog";
import { Reveal } from "@/components/marketing/home/reveal";
import { ArrowUpRight, RefreshCw } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "New Car Catalog — every make, every model, auto-updated",
  description:
    "Browse every new car model on the market — synced automatically from official vehicle databases, with photos and specifications.",
};

const TINTS = [
  "bg-[#FBE7D4]",
  "bg-[#CFE3F3]",
  "bg-[#DFEDE0]",
  "bg-[#E6E1F2]",
  "bg-[#F6DDD3]",
  "bg-[#F3F1E9]",
];

export default async function NewCarsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ make?: string }>;
}) {
  const { locale } = await params;
  const { make } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");

  const [makes, models] = await Promise.all([
    getCatalogMakes(),
    getCatalogModels({ makeSlug: make, limit: 48 }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-10 lg:pt-14">
      <Reveal>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#141414]/20 px-4 py-1.5 text-xs font-semibold text-[#141414]">
          <RefreshCw className="h-3 w-3 text-[#F0941F]" />
          {t("chip")}
        </span>
        <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#141414] max-w-2xl leading-[1.1]">
          {t("titlePre")} <span className="font-extrabold">{t("titleHighlight")}</span>
        </h1>
        <p className="mt-3 text-xs lg:text-sm text-secondary max-w-lg leading-relaxed">
          {t("subtitle")}
        </p>
      </Reveal>

      {/* Make filter chips */}
      <Reveal delay={0.1} className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/new-cars"
          className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            !make
              ? "bg-[#141414] text-white"
              : "border border-[#141414]/20 text-[#141414] hover:bg-[#141414] hover:text-white"
          }`}
        >
          {t("allMakes")}
        </Link>
        {makes.map((m) => (
          <Link
            key={m.slug}
            href={`/new-cars?make=${m.slug}`}
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              make === m.slug
                ? "bg-[#141414] text-white"
                : "border border-[#141414]/20 text-[#141414] hover:bg-[#141414] hover:text-white"
            }`}
          >
            {m.name}
          </Link>
        ))}
      </Reveal>

      {/* Model grid */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-4">
        {models.map((m, i) => (
          <Reveal key={`${m.makeSlug}-${m.slug}`} delay={(i % 4) * 0.06}>
            <Link href={`/new-cars/${m.makeSlug}/${m.slug}`} className="group block">
              <div
                className={`relative aspect-[4/3] rounded-3xl overflow-hidden ${TINTS[i % TINTS.length]}`}
              >
                <Image
                  src={m.imageUrl}
                  alt={`${m.latestYear ?? ""} ${m.makeName} ${m.name}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {m.latestYear ? (
                  <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-[#141414]">
                    {m.latestYear}
                  </span>
                ) : null}
                <span className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-white/95 flex items-center justify-center text-[#141414] opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="h-3.5 w-3.5 rtl-flip" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
                  {m.makeName}
                </div>
                <div className="text-sm font-semibold text-[#141414] truncate">{m.name}</div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>

      {models.length === 0 && (
        <div className="mt-10 rounded-3xl bg-white shadow-card p-10 text-center text-sm text-secondary">
          {t("empty")}
        </div>
      )}
    </div>
  );
}
