import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCatalogModel } from "@/lib/data/catalog";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/home/reveal";
import { ArrowLeft, Search, RefreshCw } from "lucide-react";

export const revalidate = 3600;

const SPEC_LABELS: Record<string, string> = {
  class: "Body class",
  cylinders: "Cylinders",
  displacement: "Displacement (L)",
  drive: "Drivetrain",
  fuel_type: "Fuel type",
  transmission: "Transmission",
  city_mpg: "City (mpg)",
  highway_mpg: "Highway (mpg)",
  combination_mpg: "Combined (mpg)",
};

export default async function CatalogModelPage({
  params,
}: {
  params: Promise<{ locale: string; make: string; model: string }>;
}) {
  const { locale, make, model } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");

  const detail = await getCatalogModel(make, model);
  if (!detail) notFound();

  const specEntries = Object.entries(detail.specs ?? {}).filter(
    ([k, v]) => SPEC_LABELS[k] && v != null && v !== "",
  );

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-8 lg:pt-12">
      <Reveal>
        <Link
          href="/new-cars"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-[#141414] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl-flip" />
          {t("backToCatalog")}
        </Link>
      </Reveal>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Reveal className="relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-[#CFE3F3]">
          <Image
            src={detail.imageUrl}
            alt={`${detail.latestYear ?? ""} ${detail.makeName} ${detail.name}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </Reveal>

        <Reveal delay={0.1} className="rounded-[2rem] bg-white shadow-card p-6 lg:p-10">
          <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">
            {detail.makeName}
          </div>
          <h1 className="mt-1 text-3xl lg:text-4xl font-extrabold tracking-tight text-[#141414]">
            {detail.name}
          </h1>
          {detail.bodyType && (
            <span className="mt-3 inline-flex items-center rounded-full bg-[#FBE7D4] px-3 py-1 text-[11px] font-semibold text-[#C97612] capitalize">
              {detail.bodyType}
            </span>
          )}

          {detail.years.length > 0 && (
            <div className="mt-5">
              <div className="text-[11px] uppercase tracking-wider text-muted font-semibold mb-2">
                {t("modelYears")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {detail.years.map((y) => (
                  <span
                    key={y}
                    className="rounded-full border border-[#141414]/15 px-3 py-1 text-xs font-semibold text-[#141414]"
                  >
                    {y}
                  </span>
                ))}
              </div>
            </div>
          )}

          {specEntries.length > 0 ? (
            <div className="mt-6">
              <div className="text-[11px] uppercase tracking-wider text-muted font-semibold mb-2">
                {t("specifications")}
              </div>
              <dl className="divide-y divide-[#E7E4DA]">
                {specEntries.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2.5">
                    <dt className="text-xs text-secondary">{SPEC_LABELS[k]}</dt>
                    <dd className="text-xs font-semibold text-[#141414] capitalize">
                      {String(v)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <p className="mt-6 inline-flex items-center gap-2 text-[11px] text-muted leading-relaxed">
              <RefreshCw className="h-3 w-3" />
              {t("specsPending")}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-2">
            <Button asChild variant="gold" size="lg">
              <Link
                href={`/buy?make=${encodeURIComponent(detail.makeName)}`}
                className="inline-flex items-center gap-1.5"
              >
                <Search className="h-3.5 w-3.5" />
                {t("findUsed", { model: detail.name })}
              </Link>
            </Button>
            <Button asChild variant="gold_outline" size="lg">
              <Link href="/contact">{t("askConcierge")}</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
