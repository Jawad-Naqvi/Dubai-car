"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { popularMakes } from "@/lib/brand";

export function QuickStartCard() {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [kms, setKms] = useState("");

  const go = () => {
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (year) params.set("year", year);
    if (kms) params.set("kms", kms);
    router.push(`/sell/new?${params.toString()}`);
  };

  return (
    <div className="relative">
      <div className="rounded-xl bg-white border border-[#E5E5E5] p-6 shadow-card">
        <Eyebrow tone="gold">QUICK START</Eyebrow>
        <h3 className="mt-4 text-sm font-semibold">Tell us about your car</h3>
        <div className="mt-5 space-y-3">
          <select
            value={make}
            onChange={(e) => setMake(e.target.value)}
            className="w-full h-11 rounded-sm bg-white border border-[#E5E5E5] px-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C8A93E]"
          >
            <option value="">Select make</option>
            {popularMakes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Model (e.g. Land Cruiser)"
            className="w-full h-11 rounded-sm bg-white border border-[#E5E5E5] px-3 text-sm text-[#1A1A1A] placeholder:text-muted focus:outline-none focus:border-[#C8A93E]"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              inputMode="numeric"
              placeholder="Year"
              className="h-11 rounded-sm bg-white border border-[#E5E5E5] px-3 text-sm text-[#1A1A1A] placeholder:text-muted focus:outline-none focus:border-[#C8A93E]"
            />
            <input
              value={kms}
              onChange={(e) => setKms(e.target.value)}
              inputMode="numeric"
              placeholder="Kilometers"
              className="h-11 rounded-sm bg-white border border-[#E5E5E5] px-3 text-sm text-[#1A1A1A] placeholder:text-muted focus:outline-none focus:border-[#C8A93E]"
            />
          </div>
          <Button variant="gold" size="lg" className="w-full" onClick={go}>
            Continue →
          </Button>
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 -z-10 h-40 w-40 rounded-full bg-[#C8A93E]/30 blur-3xl" />
    </div>
  );
}
