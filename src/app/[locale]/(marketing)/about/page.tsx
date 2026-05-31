import { setRequestLocale } from "next-intl/server";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { BentoCard, BentoTitle, BentoDesc } from "@/components/marketing/bento-card";
import { RadialGlow, StarField } from "@/components/marketing/radial-glow";
import Link from "next/link";
import {
  Building2,
  Globe,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

const principles = [
  { icon: Building2, title: "Yard-forward", desc: "We exist for the yards. Tools, not just classifieds." },
  { icon: ShieldCheck, title: "Trust is the product", desc: "Verification, inspection, and clear paper trails by default." },
  { icon: Globe, title: "Built for export", desc: "B2B-ready from day one — not bolted on." },
  { icon: Sparkles, title: "AI-native", desc: "Natural-language search and AI valuation across every listing." },
  { icon: Users, title: "Bilingual", desc: "Arabic and English are equal citizens, not afterthoughts." },
  { icon: TrendingUp, title: "Tax-efficient", desc: "Operated from a UAE Free Zone. 0% qualifying corporate tax." },
];

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <section className="relative pt-12 pb-24 overflow-hidden">
        <StarField />
        <RadialGlow color="gold" size="xl" className="-top-40 -right-40 opacity-25" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-6">
          <Eyebrow tone="gold">ABOUT DXB MOTORS</Eyebrow>
          <h1 className="mt-6 text-sm lg:text-2xl font-bold tracking-tight leading-[1.05] max-w-4xl">
            We're building Dubai's car operating system.
          </h1>
          <p className="mt-8 text-sm text-secondary max-w-2xl leading-relaxed">
            The UAE used-car market is heading from USD 20 billion in 2024 to
            USD 35 billion by 2030. The platforms serving it haven't kept up.
            DXB Motors is the yard-forward, AI-native, export-ready alternative.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {principles.map((p) => (
              <div
                key={p.title}
                className="rounded bg-[#161616] border border-white/8 p-4 hover:border-[#D4AF37]/30 transition-colors"
              >
                <div className="h-12 w-12 rounded-sm bg-[#D4AF37]/15 ring-1 ring-[#D4AF37]/30 flex items-center justify-center mb-5">
                  <p.icon className="h-5 w-5 text-[#F0CE5C]" />
                </div>
                <h3 className="font-semibold text-sm">{p.title}</h3>
                <p className="mt-2 text-sm text-secondary leading-relaxed">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-6">
          <div className="grid grid-cols-12 gap-5 auto-rows-[240px]">
            <BentoCard variant="gold" className="col-span-12 md:col-span-7 row-span-2">
              <Eyebrow className="bg-[#1A1208]/10 text-[#1A1208] ring-[#1A1208]/30">
                MARKET POSITION
              </Eyebrow>
              <BentoTitle className="text-[#1A1208] mt-6">
                None of the incumbent platforms own both yard-self-service and B2B export.
              </BentoTitle>
              <p className="mt-4 text-[#1A1208]/80 max-w-md">
                Dubizzle is too general. YallaMotor is content-heavy.
                DubiCars lacks export. Kavak is retail. We sit at the intersection
                — purpose-built for the yards and importers Dubai's market
                actually runs on.
              </p>
            </BentoCard>

            <BentoCard variant="dark" className="col-span-12 md:col-span-5">
              <div className="text-sm font-bold text-gradient-gold">USD 35B</div>
              <p className="mt-3 text-sm text-secondary">
                UAE used-car market projection by 2030.
                <br />
                <span className="text-muted text-xs">
                  Source: Mordor Intelligence, Nexdigm Research
                </span>
              </p>
            </BentoCard>

            <BentoCard variant="emerald" className="col-span-12 md:col-span-5">
              <div className="text-sm font-bold text-[#F0CE5C]">+42%</div>
              <p className="mt-3 text-sm text-secondary">
                Increase in online car demand in the UAE in H1 2025 vs H1 2024.
                <br />
                <span className="text-muted text-xs">Source: DubiCars</span>
              </p>
            </BentoCard>

            <BentoCard variant="dark" className="col-span-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <Eyebrow tone="gold">JOIN US</Eyebrow>
                  <BentoTitle className="mt-3">
                    We're hiring across engineering, sales, and operations.
                  </BentoTitle>
                </div>
                <Button asChild variant="gold" size="lg">
                  <Link href="/careers">See open roles</Link>
                </Button>
              </div>
            </BentoCard>
          </div>
        </div>
      </section>
    </>
  );
}
