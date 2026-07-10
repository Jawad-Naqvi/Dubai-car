"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RadialGlow } from "@/components/marketing/radial-glow";
import { formatAED, monthlyEMI } from "@/lib/utils";
import { Calculator, Wallet, Building2, Percent } from "lucide-react";

const banks = [
  { name: "Emirates NBD", aprFrom: 3.49, logo: "ENBD" },
  { name: "ADCB", aprFrom: 3.69, logo: "ADCB" },
  { name: "FAB", aprFrom: 3.79, logo: "FAB" },
  { name: "Mashreq", aprFrom: 3.99, logo: "MAQ" },
];

export default function FinancePage() {
  const [price, setPrice] = useState(180000);
  const [down, setDown] = useState(20);
  const [years, setYears] = useState(4);
  const [apr, setApr] = useState(4);

  const principal = price * (1 - down / 100);
  const emi = monthlyEMI(principal, years, apr / 100);
  const totalInterest = emi * years * 12 - principal;

  return (
    <>
      <section className="relative pt-12 pb-20 overflow-hidden">
        <RadialGlow color="gold" size="xl" className="-top-40 -left-40 opacity-25" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-6">
          <div className="max-w-3xl">
            <Eyebrow tone="gold">CAR LOAN CALCULATOR</Eyebrow>
            <h1 className="mt-6 text-3xl lg:text-5xl font-light tracking-tight leading-[1.05]">
              Estimate your <span className="font-extrabold">monthly car payment</span> in AED.
            </h1>
            <p className="mt-6 text-sm text-secondary max-w-xl">
              Adjust price, down payment, and term. Compare bank rates side-by-side.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-3xl bg-white border border-[#E7E4DA] shadow-card p-5">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-secondary">Car price</label>
                    <span className="text-sm font-semibold">{formatAED(price)}</span>
                  </div>
                  <input
                    type="range"
                    min={20000}
                    max={1500000}
                    step={5000}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full accent-[#141414]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-secondary">Down payment</label>
                    <span className="text-sm font-semibold">{down}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={down}
                    onChange={(e) => setDown(Number(e.target.value))}
                    className="w-full accent-[#141414]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-secondary">Loan term</label>
                    <span className="text-sm font-semibold">{years} years</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={7}
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full accent-[#141414]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-secondary">APR</label>
                    <span className="text-sm font-semibold">{apr.toFixed(2)}%</span>
                  </div>
                  <input
                    type="range"
                    min={2.5}
                    max={9}
                    step={0.1}
                    value={apr}
                    onChange={(e) => setApr(Number(e.target.value))}
                    className="w-full accent-[#141414]"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-[#FBE7D4] border border-[#E7E4DA] shadow-card p-5 relative overflow-hidden">
              <div className="relative">
                <Calculator className="h-6 w-6 text-[#F0941F]" />
                <div className="mt-4 text-sm text-secondary">Monthly payment</div>
                <div className="mt-2 text-2xl lg:text-3xl font-extrabold tracking-tight text-[#141414] leading-none">
                  {formatAED(emi)}
                </div>

                <div className="mt-8 space-y-3">
                  {[
                    { label: "Loan amount", value: formatAED(principal) },
                    { label: "Down payment", value: formatAED(price * (down / 100)) },
                    { label: "Total interest", value: formatAED(totalInterest) },
                    { label: "Total payable", value: formatAED(emi * years * 12) },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="flex justify-between text-sm border-b border-[#141414]/10 pb-2"
                    >
                      <span className="text-secondary">{r.label}</span>
                      <span className="font-semibold">{r.value}</span>
                    </div>
                  ))}
                </div>

                <Button asChild variant="gold" size="lg" className="mt-6 w-full">
                  <Link href="/contact">Get pre-approved</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Bank rates */}
          <div className="mt-24">
            <Eyebrow tone="emerald">BANK PARTNERS</Eyebrow>
            <h2 className="mt-4 text-2xl lg:text-3xl font-bold tracking-tight">
              Live rates from UAE banks
            </h2>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {banks.map((b) => (
                <div
                  key={b.name}
                  className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-6 hover:border-[#D8D4C6] hover:shadow-card-hover transition-all"
                >
                  <div className="h-12 w-12 rounded-full bg-[#181C30] text-white flex items-center justify-center text-xs font-bold mb-4">
                    {b.logo}
                  </div>
                  <h3 className="font-semibold">{b.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-lg font-extrabold tracking-tight text-[#141414]">
                      {b.aprFrom}%
                    </span>
                    <span className="text-xs text-muted">APR from</span>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="mt-4 w-full">
                    <Link href="/contact">Apply →</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
