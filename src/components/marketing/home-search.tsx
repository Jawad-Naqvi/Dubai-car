"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Hero search. Parses a couple of light natural-language hints (price + make)
 * out of the query, the rest becomes a keyword search on /buy.
 */
export function HomeSearch() {
  const t = useTranslations();
  const router = useRouter();
  const [value, setValue] = useState("");

  const go = () => {
    const q = value.trim();
    if (!q) {
      router.push("/buy");
      return;
    }
    const params = new URLSearchParams();
    // "under 50k" / "below 200000"
    const priceMatch = q.match(/(?:under|below|less than)\s*([\d,.]+)\s*(k)?/i);
    if (priceMatch) {
      let n = Number(priceMatch[1].replace(/[,.]/g, ""));
      if (priceMatch[2]) n *= 1000;
      if (n > 0) params.set("priceMax", String(n));
    }
    if (/export/i.test(q)) params.set("exportReady", "true");
    const cleaned = q
      .replace(/(?:under|below|less than)\s*[\d,.]+\s*k?/gi, "")
      .replace(/export(?:\s*ready)?/gi, "")
      .replace(/\bAED\b/gi, "")
      .trim();
    if (cleaned) params.set("q", cleaned);
    router.push(`/buy?${params.toString()}`);
  };

  return (
    <div className="mt-6 max-w-xl mx-auto">
      <div className="relative">
        <div className="absolute inset-0 rounded bg-gradient-to-r from-[#D4AF37]/30 via-[#F0CE5C]/40 to-[#D4AF37]/30 blur-lg opacity-50" />
        <div className="relative flex items-center gap-1.5 bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/15 rounded p-1 pl-3">
          <Sparkles className="h-3.5 w-3.5 text-[#F0CE5C] flex-shrink-0" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder={t("hero.searchPlaceholder")}
            suppressHydrationWarning
            className="flex-1 bg-transparent text-white placeholder:text-muted text-xs outline-none py-1.5"
          />
          <Button variant="gold" size="md" onClick={go}>
            <Search className="h-3 w-3" />
            {t("common.search")}
          </Button>
        </div>
      </div>
    </div>
  );
}
