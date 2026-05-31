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
          <h1 className="mt-6 text-sm lg:text-2xl font-bold tracking-tight leading-[1.05] max-w-3xl mx-auto">
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
                      ? "relative rounded bg-gradient-to-br from-[#D4AF37] via-[#8C7220] to-[#1A1A1A] p-[1.5px]"
                      : "rounded bg-[#161616] border border-white/8 p-5 flex flex-col"
                  }
                >
                  {isRecommended ? (
                    <div className="rounded-sm bg-[#0A0A0A] p-5 flex flex-col h-full relative overflow-hidden">
                      <RadialGlow color="gold" size="sm" className="-top-6 -right-10 opacity-40" />
                      <div className="relative flex flex-col h-full">
                        <Badge tone="featured" className="self-start mb-4">
                          {t("recommended")}
                        </Badge>
                        <Icon className="h-6 w-6 text-[#F0CE5C] mb-3" />
                        <h3 className="text-sm font-bold">{tier.name}</h3>
                        <div className="mt-4">
                          <span className="text-sm font-bold text-gradient-gold">
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
                              <CheckCircle2 className="h-4 w-4 text-[#F0CE5C] flex-shrink-0 mt-0.5" />
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
                      <Icon className="h-6 w-6 text-[#F0CE5C] mb-3" />
                      <h3 className="text-sm font-bold">{tier.name}</h3>
                      <div className="mt-4">
                        <span className="text-sm font-bold">
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
                            <CheckCircle2 className="h-4 w-4 text-[#F0CE5C] flex-shrink-0 mt-0.5" />
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
            <h2 className="mt-4 text-sm font-bold tracking-tight">
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
                  className="rounded bg-[#161616] border border-white/8 p-6"
                >
                  <h3 className="font-semibold">{a.name}</h3>
                  <div className="mt-3 text-sm font-bold text-gradient-gold">
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
