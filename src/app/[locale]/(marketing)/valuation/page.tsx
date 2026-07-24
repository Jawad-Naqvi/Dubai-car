"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RadialGlow } from "@/components/marketing/radial-glow";
import { formatAED } from "@/lib/utils";
import { popularMakes, conditions } from "@/lib/brand";
import { estimateValue } from "@/lib/valuation";
import { Sparkles, AlertCircle, Loader2, BadgeCheck } from "lucide-react";

function ValuationForm() {
  // Prefill from the home "Sell your car" tab (or any deep link), else defaults.
  const params = useSearchParams();
  const numParam = (key: string, fallback: number) => {
    const n = Number(params.get(key));
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const [make, setMake] = useState(() => params.get("make") || "Toyota");
  const [model, setModel] = useState(() => params.get("model") || "Land Cruiser");
  const [year, setYear] = useState(() => numParam("year", 2022));
  const [kms, setKms] = useState(() => numParam("kms", 40000));
  const [condition, setCondition] = useState<string>(
    () => params.get("condition") || "Used",
  );
  const [loading, setLoading] = useState(false);
  const [comps, setComps] = useState<number | null>(null);

  // Instant client-side estimate (same model the API uses).
  const v = estimateValue({ make, model, year, kms, condition });

  const getDetailed = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ make, model, year, kms, condition }),
      });
      const data = await res.json();
      setComps(data.comps ?? 0);
      toast.success(
        data.comps
          ? `Valuation saved — based on ${data.comps} live market comparables.`
          : "Valuation saved.",
      );
    } catch {
      toast.error("Could not reach the valuation service.");
    } finally {
      setLoading(false);
    }
  };

  const sellHref = `/sell/new?make=${encodeURIComponent(make)}&model=${encodeURIComponent(
    model,
  )}&year=${year}&kms=${kms}&price=${v.estimate}`;

  return (
    <section className="relative pt-12 pb-24 overflow-hidden">
      <RadialGlow color="gold" size="xl" className="-top-40 -right-40 opacity-30" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <Eyebrow tone="gold">FREE VALUATION</Eyebrow>
          <h1 className="mt-6 text-3xl lg:text-5xl font-light tracking-tight leading-[1.05]">
            What&apos;s your car <span className="font-extrabold">worth today</span> in Dubai?
          </h1>
          <p className="mt-4 text-sm text-secondary">
            Instant estimate, blended with live market data from active listings.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {/* Form */}
          <div className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-5">
            <div className="space-y-5">
              <div>
                <label className="text-xs text-muted mb-2 block">Make</label>
                <select
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full h-11 rounded-xl bg-white border border-[#E5E5EA] text-[#141414] placeholder:text-muted px-3 text-sm focus:outline-none focus:border-[#141414]/40 focus:ring-2 focus:ring-[#141414]/10"
                >
                  {popularMakes.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted mb-2 block">Model</label>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full h-11 rounded-xl bg-white border border-[#E5E5EA] text-[#141414] placeholder:text-muted px-3 text-sm focus:outline-none focus:border-[#141414]/40 focus:ring-2 focus:ring-[#141414]/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted mb-2 block">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    min={1990}
                    max={2026}
                    className="w-full h-11 rounded-xl bg-white border border-[#E5E5EA] text-[#141414] placeholder:text-muted px-3 text-sm focus:outline-none focus:border-[#141414]/40 focus:ring-2 focus:ring-[#141414]/10"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted mb-2 block">Kilometers</label>
                  <input
                    type="number"
                    value={kms}
                    onChange={(e) => setKms(Number(e.target.value))}
                    className="w-full h-11 rounded-xl bg-white border border-[#E5E5EA] text-[#141414] placeholder:text-muted px-3 text-sm focus:outline-none focus:border-[#141414]/40 focus:ring-2 focus:ring-[#141414]/10"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted mb-2 block">Condition</label>
                <div className="grid grid-cols-3 gap-2">
                  {conditions.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCondition(c)}
                      className={
                        condition === c
                          ? "h-11 rounded-full text-xs font-semibold bg-[#141414] text-white"
                          : "h-11 rounded-full text-xs font-semibold bg-white border border-[#141414]/20 text-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
                      }
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Estimate */}
          <div className="rounded-2xl bg-[#F3EDF9] border border-[#E5E5EA] shadow-card p-5 relative overflow-hidden">
            <RadialGlow color="gold" size="md" className="-top-20 -right-20 opacity-40" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-[#8136B2]" />
                <Eyebrow tone="gold">ESTIMATE</Eyebrow>
              </div>
              <div className="mt-4 text-sm text-secondary">
                {year} {make} {model}
              </div>
              <div className="mt-2 text-2xl lg:text-3xl font-extrabold tracking-tight text-[#141414] leading-none">
                {formatAED(v.estimate)}
              </div>
              <div className="mt-3 text-sm text-muted">
                Range: {formatAED(v.low)} — {formatAED(v.high)}
              </div>

              {comps !== null && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#6B21A8] bg-white/70 border border-[#8136B2]/25 rounded-full px-2.5 py-1">
                  <BadgeCheck className="h-3 w-3" />
                  {comps > 0
                    ? `Blended with ${comps} live comparables`
                    : "Saved · no comparables yet"}
                </div>
              )}

              <div className="mt-6 space-y-2.5 text-sm">
                <div className="flex justify-between text-secondary">
                  <span>Base ({make})</span>
                  <span>{formatAED(Math.round(v.base))}</span>
                </div>
                <div className="flex justify-between text-secondary">
                  <span>Year factor</span>
                  <span>×{v.yearFactor.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-secondary">
                  <span>Kms factor</span>
                  <span>×{v.kmsFactor.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-secondary">
                  <span>Condition factor</span>
                  <span>×{v.conditionFactor.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-2">
                <Button asChild variant="gold" size="lg" className="w-full">
                  <Link href={sellHref}>List my car for {formatAED(v.estimate)}</Link>
                </Button>
                <Button
                  variant="gold_outline"
                  size="md"
                  className="w-full"
                  onClick={getDetailed}
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save &amp; refine with market data
                </Button>
              </div>

              <div className="mt-4 flex items-start gap-2 text-[11px] text-muted">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                Indicative only. Actual offers depend on inspection, history, and
                trim level.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ValuationPage() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense>
      <ValuationForm />
    </Suspense>
  );
}
