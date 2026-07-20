"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Button } from "@/components/ui/button";
import { RadialGlow } from "@/components/marketing/radial-glow";
import { formatAED } from "@/lib/utils";
import { cn } from "@/lib/utils";

function emiFor(principal: number, years: number, apr: number) {
  const months = years * 12;
  const r = apr / 100 / 12;
  if (r === 0) return Math.round(principal / months);
  return Math.round(
    (principal * r * Math.pow(1 + r, months)) /
      (Math.pow(1 + r, months) - 1),
  );
}

export function FinanceCalculator({
  price,
  locale = "en",
  className,
}: {
  price: number;
  locale?: "en" | "ar";
  className?: string;
}) {
  const [downPct, setDownPct] = useState(20);
  const [termMonths, setTermMonths] = useState(48);
  const [apr, setApr] = useState(4);

  const down = Math.round((price * downPct) / 100);
  const principal = price - down;
  const emi = emiFor(principal, termMonths / 12, apr);
  const totalPayable = emi * termMonths + down;
  const totalInterest = totalPayable - price;

  return (
    <div
      className={cn(
        "rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-5 relative overflow-hidden",
        className,
      )}
    >
      <RadialGlow color="gold" size="md" className="-top-20 -right-20 opacity-30" />
      <div className="relative">
        <div className="flex items-center gap-1.5 mb-1">
          <Calculator className="h-3.5 w-3.5 text-[#F0941F]" />
          <Eyebrow tone="gold">FINANCE</Eyebrow>
        </div>
        <h3 className="text-base font-bold tracking-tight mt-2">Estimate monthly payment</h3>

        <div className="mt-4 space-y-4">
          <Slider
            label="Down payment"
            value={`${downPct}% · ${formatAED(down, locale)}`}
            min={0}
            max={60}
            step={5}
            current={downPct}
            onChange={setDownPct}
          />
          <Slider
            label="Term"
            value={`${termMonths} months`}
            min={12}
            max={84}
            step={12}
            current={termMonths}
            onChange={setTermMonths}
          />
          <Slider
            label="APR"
            value={`${apr.toFixed(1)}%`}
            min={1}
            max={10}
            step={0.5}
            current={apr}
            onChange={setApr}
          />
        </div>

        <div className="mt-4 pt-4 border-t border-[#E7E4DA] flex items-center justify-between">
          <div className="text-xs text-secondary">Estimated monthly</div>
          <div className="text-lg font-bold text-[#141414]">
            {formatAED(emi, locale)}/mo
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-muted">
          <div className="flex justify-between rounded-lg bg-[#F3F1E9] px-2 py-1.5">
            <span>Total interest</span>
            <span className="text-secondary">{formatAED(totalInterest, locale)}</span>
          </div>
          <div className="flex justify-between rounded-lg bg-[#F3F1E9] px-2 py-1.5">
            <span>Total payable</span>
            <span className="text-secondary">{formatAED(totalPayable, locale)}</span>
          </div>
        </div>

        <Button variant="gold_outline" size="md" className="mt-3 w-full" asChild>
          <a href="/finance">Get pre-approved</a>
        </Button>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-muted">{label}</span>
        <span className="text-xs font-semibold text-[#141414]">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 accent-[#141414] cursor-pointer"
      />
    </div>
  );
}
