import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { BentoCard, BentoTitle, BentoDesc } from "@/components/marketing/bento-card";
import { RadialGlow } from "@/components/marketing/radial-glow";
import { QuickStartCard } from "@/components/sell/quick-start-card";
import {
  Camera,
  Sparkles,
  TrendingUp,
  Wallet,
  Clock,
  Users,
  ArrowRight,
  Upload,
  FileSignature,
  CheckCircle2,
} from "lucide-react";

const steps = [
  { icon: Camera, title: "Add photos & details", desc: "Take 6+ photos. Fill make, model, year, kms, condition." },
  { icon: Sparkles, title: "We suggest a price", desc: "Our AI valuation shows a fair market range based on similar listings." },
  { icon: Upload, title: "Publish", desc: "Listing goes live across DXB Motors search + email alerts." },
  { icon: FileSignature, title: "Sell or export", desc: "Receive WhatsApp leads. Close the deal or pass to an exporter." },
];

export default async function SellPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <section className="relative pt-12 pb-24 overflow-hidden">
        <RadialGlow color="gold" size="xl" className="-top-40 -left-40 opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-6">
          <div className="relative rounded bg-hero-panel ring-1 ring-[#C8A93E]/25 px-5 py-8 lg:px-6 lg:py-10 grain overflow-hidden">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-center">
              <div>
                <Eyebrow tone="gold">LIST YOUR CAR</Eyebrow>
                <h1 className="mt-6 text-sm lg:text-2xl font-bold tracking-tight leading-[1.05]">
                  Sell your car in Dubai — typically within 19 days.
                </h1>
                <p className="mt-6 text-sm text-secondary max-w-xl leading-relaxed">
                  Free listings. Reach 2M+ buyers across the UAE. WhatsApp leads
                  delivered straight to your phone.
                </p>
                <div className="mt-10 flex flex-wrap gap-3">
                  <Button asChild variant="gold" size="xl">
                    <Link href="/sell/new">
                      Start listing
                      <ArrowRight className="h-4 w-4 rtl-flip" />
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="xl">
                    <Link href="/valuation">Get a free valuation</Link>
                  </Button>
                </div>

                <div className="mt-10 flex flex-wrap gap-6">
                  {[
                    { label: "19 days", desc: "Average time to sell" },
                    { label: "Free", desc: "First 3 listings" },
                    { label: "2M+", desc: "Active buyers" },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="text-2xl font-bold text-gradient-gold">
                        {s.label}
                      </div>
                      <div className="text-xs text-secondary mt-1">{s.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <QuickStartCard />
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-6">
          <div className="max-w-3xl">
            <Eyebrow tone="emerald">HOW IT WORKS</Eyebrow>
            <h2 className="mt-4 text-sm font-bold tracking-tight leading-[1.1]">
              Four steps. About 5 minutes.
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="rounded-xl bg-white border border-[#E5E5E5] shadow-card p-4 relative overflow-hidden hover:shadow-card-hover hover:border-[#C8A93E]/30 transition-colors"
              >
                <div className="text-2xl font-bold text-gradient-gold/30 absolute top-4 right-4 opacity-30">
                  0{i + 1}
                </div>
                <s.icon className="h-7 w-7 text-[#C8A93E] mb-4" />
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-secondary leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-6">
          <div className="grid grid-cols-12 gap-5 auto-rows-[220px]">
            <BentoCard variant="gold" className="col-span-12 md:col-span-7 row-span-2">
              <Wallet className="h-7 w-7 text-white mb-5" />
              <BentoTitle className="text-white">
                Fair valuations powered by 26,000+ active listings.
              </BentoTitle>
              <p className="mt-4 text-white/80 max-w-md">
                We compare your car against every similar model on the market
                right now — and show you the price range that gets a deal closed
                quickly.
              </p>
            </BentoCard>
            <BentoCard variant="dark" className="col-span-12 md:col-span-5">
              <Users className="h-7 w-7 text-[#C8A93E] mb-4" />
              <BentoTitle className="text-sm">
                Direct WhatsApp leads — no spam.
              </BentoTitle>
              <BentoDesc className="text-sm mt-2">
                Only serious buyers can unlock your phone. Lead fees deter spam.
              </BentoDesc>
            </BentoCard>
            <BentoCard variant="emerald" className="col-span-12 md:col-span-5">
              <Clock className="h-7 w-7 text-[#C8A93E] mb-4" />
              <BentoTitle className="text-sm">
                Most cars sell within 19 days.
              </BentoTitle>
              <p className="mt-2 text-sm text-secondary">
                Featured listings sell 2.3× faster than standard.
              </p>
            </BentoCard>
          </div>
        </div>
      </section>
    </>
  );
}
