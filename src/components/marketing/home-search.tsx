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
    <div className="relative flex items-center gap-2 bg-white border border-[#D9D9E0] rounded-full transition-colors focus-within:border-[#8136B2] focus-within:ring-1 focus-within:ring-[#8136B2] p-1 pl-4">
      <Search className="h-4 w-4 text-[#141414] flex-shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
        placeholder={t("hero.searchPlaceholder")}
        suppressHydrationWarning
        className="flex-1 bg-transparent text-[#141414] placeholder:text-muted text-sm outline-none py-2"
      />
      <Button
        variant="gold"
        size="md"
        className="rounded-full px-5"
        onClick={go}
      >
        {t("common.search")}
      </Button>
    </div>
  );
}
