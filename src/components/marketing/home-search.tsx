"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
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
    <div className="mt-8 max-w-2xl mx-auto">
      <div className="relative">
        <div className="relative flex items-center gap-2 bg-white border border-[#E7E4DA] rounded-full shadow-card hover:shadow-card-hover transition-shadow p-1.5 pl-5">
          <Search className="h-5 w-5 text-[#F0941F] flex-shrink-0" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder={t("hero.searchPlaceholder")}
            suppressHydrationWarning
            className="flex-1 bg-transparent text-[#141414] placeholder:text-muted text-sm outline-none py-2.5"
          />
          <Button variant="gold" size="lg" className="rounded-full px-6" onClick={go}>
            <Search className="h-4 w-4" />
            {t("common.search")}
          </Button>
        </div>
      </div>
    </div>
  );
}
