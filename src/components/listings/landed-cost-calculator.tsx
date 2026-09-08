"use client";

import { useMemo, useState } from "react";
import {
  calculateLandedCost,
  supportedDestinations,
  estimateFreightAED,
  type LandedCostResult,
} from "@/lib/freight/landed-cost";
import {
  Globe2,
  ChevronDown,
  Info,
  AlertTriangle,
  Ship,
  Calculator,
} from "lucide-react";

/**
 * "What will this actually cost me at home?"
 *
 * For an export buyer the sticker price is less than half the story — Kenya
 * stacks duty, excise and VAT; India's taxes can exceed the car. Answering
 * that here, on the listing, is the difference between a considered enquiry
 * and a WhatsApp thread that dies after "how much to Mombasa?".
 *
 * Every figure is labelled an ESTIMATE and shows its confidence and caveats.
 * A number this consequential presented as a certainty would be worse than
 * showing nothing.
 */

const MODES = [
  { value: "roro", label: "RO-RO" },
  { value: "container_lcl", label: "Shared container" },
  { value: "container_fcl", label: "Own container" },
] as const;

const CONFIDENCE_COPY: Record<string, { label: string; cls: string }> = {
  high: { label: "Good confidence", cls: "bg-[#137A43]/12 text-[#137A43]" },
  medium: { label: "Indicative", cls: "bg-[#B7791F]/12 text-[#8A5A12]" },
  low: { label: "Rough guide", cls: "bg-[#DC2626]/10 text-[#DC2626]" },
};

export function LandedCostCalculator({
  vehicleAED,
  className,
}: {
  vehicleAED: number;
  className?: string;
}) {
  const destinations = useMemo(() => supportedDestinations(), []);
  const [dest, setDest] = useState("");
  const [mode, setMode] = useState<(typeof MODES)[number]["value"]>("roro");
  const [includeInspection, setIncludeInspection] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const freightAED = dest ? estimateFreightAED(dest, mode) : 0;

  const result: LandedCostResult | null = useMemo(() => {
    if (!dest) return null;
    return calculateLandedCost({
      vehicleAED,
      freightAED,
      destCountry: dest,
      includeInspection,
    });
  }, [dest, vehicleAED, freightAED, includeInspection]);

  const conf = result ? CONFIDENCE_COPY[result.confidence] : null;

  return (
    <section
      className={`rounded-xl border border-[#E5E5EA] bg-white overflow-hidden ${className ?? ""}`}
    >
      <div className="flex items-center gap-2 border-b border-[#E5E5EA] px-4 py-3">
        <Calculator className="h-4 w-4 text-[#8136B2]" />
        <div className="min-w-0">
          <h2 className="text-xs font-bold text-[#141414]">
            Cost to import this car
          </h2>
          <p className="text-[11px] text-muted">
            Duty, freight and clearance for your country.
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] font-semibold text-[#141414]">
              Shipping to
            </span>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E5EA] px-2 focus-within:border-[#8136B2]">
              <Globe2 className="h-3.5 w-3.5 text-muted flex-shrink-0" />
              <select
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                className="h-9 flex-1 bg-transparent text-xs outline-none"
              >
                <option value="">Choose a country…</option>
                {destinations.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="block">
            <span className="text-[11px] font-semibold text-[#141414]">
              How it travels
            </span>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E5EA] px-2 focus-within:border-[#8136B2]">
              <Ship className="h-3.5 w-3.5 text-muted flex-shrink-0" />
              <select
                value={mode}
                onChange={(e) =>
                  setMode(e.target.value as (typeof MODES)[number]["value"])
                }
                className="h-9 flex-1 bg-transparent text-xs outline-none"
              >
                {MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>

        {!result && (
          <p className="rounded-lg bg-[#F4F4F6] px-3 py-2.5 text-[11px] text-secondary leading-relaxed">
            Pick a destination to see the full cost — vehicle, shipping, import
            duty, taxes and port clearance — before you enquire.
          </p>
        )}

        {result && (
          <>
            <div className="rounded-xl bg-[#F3EDF9] p-4">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-[#6B21A8]">
                  Estimated landed cost in {result.countryName}
                </span>
                {conf && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${conf.cls}`}
                  >
                    {conf.label}
                  </span>
                )}
              </div>
              <div className="mt-1 text-2xl font-extrabold tracking-tight text-[#141414] tabular-nums">
                AED {result.totalAED.toLocaleString()}
              </div>
              {result.supported && result.dutyRatio > 0 && (
                <p className="mt-1 text-[11px] text-secondary">
                  Duty and taxes add{" "}
                  <span className="font-bold text-[#141414]">
                    AED {result.dutyTotalAED.toLocaleString()}
                  </span>{" "}
                  — about {Math.round(result.dutyRatio * 100)}% on top of the car.
                </p>
              )}
            </div>

            {result.supported && (
              <label className="flex items-center gap-2 text-[11px] text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeInspection}
                  onChange={(e) => setIncludeInspection(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[#8136B2]"
                />
                Include pre-shipment inspection (required by some countries)
              </label>
            )}

            <button
              type="button"
              onClick={() => setShowBreakdown((v) => !v)}
              aria-expanded={showBreakdown}
              className="flex w-full items-center justify-between rounded-lg border border-[#E5E5EA] px-3 py-2 text-[11px] font-semibold text-[#141414] hover:bg-[#F4F4F6] transition-colors"
            >
              {showBreakdown ? "Hide" : "See"} the full breakdown
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${showBreakdown ? "rotate-180" : ""}`}
              />
            </button>

            {showBreakdown && (
              <ul className="rounded-lg border border-[#E5E5EA] divide-y divide-[#E5E5EA]">
                {result.lines.map((line, i) => (
                  <li key={i} className="px-3 py-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <span
                        className={`text-[11px] ${
                          line.kind === "duty"
                            ? "text-[#8A5A12] font-medium"
                            : "text-secondary"
                        }`}
                      >
                        {line.label}
                      </span>
                      <span className="text-[11px] font-semibold text-[#141414] tabular-nums flex-shrink-0">
                        AED {line.amountAED.toLocaleString()}
                      </span>
                    </div>
                    {line.note && (
                      <p className="mt-0.5 text-[10px] text-muted leading-relaxed">
                        {line.note}
                      </p>
                    )}
                  </li>
                ))}
                <li className="flex items-baseline justify-between gap-3 bg-[#F4F4F6] px-3 py-2.5">
                  <span className="text-[11px] font-bold text-[#141414]">
                    Total landed cost
                  </span>
                  <span className="text-xs font-extrabold text-[#141414] tabular-nums">
                    AED {result.totalAED.toLocaleString()}
                  </span>
                </li>
              </ul>
            )}

            {result.restrictions.length > 0 && (
              <div className="rounded-lg border border-[#DC2626]/25 bg-[#DC2626]/5 p-3">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#DC2626] flex-shrink-0" />
                  <h3 className="text-[11px] font-bold text-[#DC2626]">
                    Check before you buy
                  </h3>
                </div>
                <ul className="mt-1.5 space-y-1">
                  {result.restrictions.map((r, i) => (
                    <li
                      key={i}
                      className="text-[10px] text-[#DC2626] leading-relaxed"
                    >
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-start gap-1.5 rounded-lg bg-[#F4F4F6] px-3 py-2.5">
              <Info className="h-3 w-3 text-muted flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] text-secondary leading-relaxed">
                  An estimate, not a quote. Customs usually assess duty on their
                  own valuation rather than the invoice, and clearing charges
                  vary by agent. Book shipping through us and you get a binding
                  freight price from a verified partner.
                </p>
                {result.caveats.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {result.caveats.map((c, i) => (
                      <li
                        key={i}
                        className="text-[10px] text-muted leading-relaxed"
                      >
                        • {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
