"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Tag } from "lucide-react";
import { HomeSearch } from "./home-search";
import { HomeSearchBy } from "./home-search-by";
import { HomeSell } from "./home-sell";

type Tab = "shop" | "sell";

/**
 * cars.com-style hero switcher: "Shop cars for sale" (keyword + structured
 * search) and "Sell your car" (valuation / listing entry) under one card, so
 * the primary action for both buyers and sellers lives on the home page.
 */
export function HomeSearchTabs() {
  const t = useTranslations("home.hero");
  const [tab, setTab] = useState<Tab>("shop");

  const tabBtn = (key: Tab, label: string, Icon: typeof Search) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === key}
      onClick={() => setTab(key)}
      className={
        "flex items-center justify-center gap-1.5 pb-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors " +
        (tab === key
          ? "border-[#141414] text-[#141414]"
          : "border-transparent text-muted hover:text-[#141414]")
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-6 border-b border-[#141414]/10">
        {tabBtn("shop", t("shopTab"), Search)}
        {tabBtn("sell", t("sellTab"), Tag)}
      </div>

      <div className="mt-4">
        {tab === "shop" ? (
          <>
            <HomeSearch />
            <div className="my-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#141414]/10" />
              <span className="text-[11px] font-medium text-muted">
                {t("orSearchBy")}
              </span>
              <div className="h-px flex-1 bg-[#141414]/10" />
            </div>
            <HomeSearchBy />
          </>
        ) : (
          <HomeSell />
        )}
      </div>
    </div>
  );
}
