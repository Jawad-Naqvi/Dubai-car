import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Badge } from "@/components/ui/badge";
import { RadialGlow } from "@/components/marketing/radial-glow";
import { subscriptionTiers } from "@/lib/brand";
import { formatAED } from "@/lib/utils";
import { CheckCircle2, Sparkles, Building2, ShieldCheck } from "lucide-react";

const tierIcons = [Sparkles, Sparkles, ShieldCheck, Building2];

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");

  return (
    <>
      <section className="relative pt-16 pb-24 overflow-hidden">
        <RadialGlow color="gold" size="xl" className="-top-40 left-1/2 -translate-x-1/2 opacity-25" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-6 text-center">
          <Eyebrow tone="gold">DEALER PLANS</Eyebrow>
          <h1 className="mt-6 text-3xl lg:text-5xl font-light tracking-tight leading-[1.05] max-w-3xl mx-auto">
            {t("title")}
          </h1>
          <p className="mt-6 text-sm text-secondary max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </section>

      <section className="relative pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {subscriptionTiers.map((tier, i) => {
              const Icon = tierIcons[i];
              const isRecommended = "recommended" in tier && tier.recommended;
              return (
                <div
                  key={tier.id}
                  className={
                    isRecommended
                      ? "relative rounded-3xl border-2 border-[#141414] bg-white shadow-card-hover"
                      : "rounded-3xl bg-white border border-[#E7E4DA] shadow-card p-5 flex flex-col"
                  }
                >
                  {isRecommended ? (
                    <div className="rounded-3xl bg-white p-5 flex flex-col h-full relative overflow-hidden">
                      <div className="relative flex flex-col h-full">
                        <Badge tone="featured" className="self-start mb-4">
                          {t("recommended")}
                        </Badge>
                        <Icon className="h-6 w-6 text-[#F0941F] mb-3" />
                        <h3 className="text-sm font-bold">{tier.name}</h3>
                        <div className="mt-4">
                          <span className="text-2xl font-extrabold tracking-tight text-[#141414]">
                            {tier.monthlyAED === 0 ? "Free" : formatAED(tier.monthlyAED, locale as "en" | "ar")}
                          </span>
                          {tier.monthlyAED > 0 && (
                            <span className="text-sm text-muted ml-1">
                              {t("monthly")}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-secondary">
                          {tier.listings === Infinity
                            ? t("unlimited")
                            : `${tier.listings} listings`}
                        </p>
                        <ul className="mt-6 space-y-3 flex-1">
                          {tier.features.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-sm text-secondary">
                              <CheckCircle2 className="h-4 w-4 text-[#F0941F] flex-shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                        <Button asChild variant="gold" size="lg" className="mt-6">
                          <Link href="/sign-up">{t("getStarted")}</Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Icon className="h-6 w-6 text-[#F0941F] mb-3" />
                      <h3 className="text-sm font-bold">{tier.name}</h3>
                      <div className="mt-4">
                        <span className="text-2xl font-extrabold tracking-tight text-[#141414]">
                          {tier.monthlyAED === 0
                            ? "Free"
                            : formatAED(tier.monthlyAED, locale as "en" | "ar")}
                        </span>
                        {tier.monthlyAED > 0 && (
                          <span className="text-sm text-muted ml-1">
                            {t("monthly")}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-secondary">
                        {tier.listings === Infinity
                          ? t("unlimited")
                          : `${tier.listings} listings`}
                      </p>
                      <ul className="mt-6 space-y-3 flex-1">
                        {tier.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-2 text-sm text-secondary"
                          >
                            <CheckCircle2 className="h-4 w-4 text-[#F0941F] flex-shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        asChild
                        variant={tier.id === "platinum" ? "gold" : "ghost"}
                        size="lg"
                        className="mt-6"
                      >
                        <Link href="/sign-up">
                          {tier.id === "platinum" ? t("talkToSales") : t("getStarted")}
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add-ons */}
          <div className="mt-24">
            <Eyebrow tone="gold">PERFORMANCE ADD-ONS</Eyebrow>
            <h2 className="mt-4 text-2xl lg:text-3xl font-bold tracking-tight">
              Boost reach when you need it
            </h2>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Featured listing", price: "AED 49", desc: "Top of search for 7 days" },
                { name: "Homepage banner", price: "From AED 500/wk", desc: "Hero exposure to all visitors" },
                { name: "Category sponsor", price: "AED 800/mo", desc: "Top of a make or body type" },
                { name: "B2B export visibility", price: "AED 1,000/mo", desc: "Appear in the export module" },
              ].map((a) => (
                <div
                  key={a.name}
                  className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-6 hover:shadow-card-hover hover:border-[#D8D4C6] transition-all"
                >
                  <h3 className="font-semibold">{a.name}</h3>
                  <div className="mt-3 text-lg font-extrabold tracking-tight text-[#141414]">
                    {a.price}
                  </div>
                  <p className="mt-2 text-xs text-secondary leading-relaxed">
                    {a.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
