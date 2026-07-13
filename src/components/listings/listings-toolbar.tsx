"use client";

import { useState } from "react";
import { Search, ArrowUpDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryState } from "@/lib/use-query-state";
import { emirates } from "@/lib/brand";

const SORT_LABELS: Record<string, string> = {
  newest: "Newest first",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  year_desc: "Year: newest",
  kms_asc: "Mileage: lowest",
};

export function ListingSearchBar({ className }: { className?: string }) {
  const { get, push } = useQueryState();
  const [value, setValue] = useState(get("q") ?? "");

  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 bg-white border border-[#E7E4DA] rounded-full shadow-card p-1 pl-3">
        <Search className="h-3.5 w-3.5 text-[#F0941F]" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && push({ q: value || null })}
          placeholder="Make, model, or keyword"
          suppressHydrationWarning
          className="flex-1 bg-transparent text-[#141414] placeholder:text-muted text-xs outline-none py-1.5"
        />
        <Button variant="gold" size="md" onClick={() => push({ q: value || null })}>
          Search
        </Button>
      </div>
    </div>
  );
}

export function ListingSortBar() {
  const { get, push } = useQueryState();
  const sort = get("sort") ?? "newest";
  const emirate = get("emirate") ?? "";

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <select
          value={emirate}
          onChange={(e) => push({ emirate: e.target.value || null })}
          suppressHydrationWarning
          className="appearance-none flex items-center gap-1 h-7 pl-6 pr-6 rounded-full bg-white border border-[#E7E4DA] text-[10px] text-secondary hover:border-[#141414]/30 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 cursor-pointer"
        >
          <option value="">All emirates</option>
          {emirates.map((e) => (
            <option key={e.id} value={e.en}>
              {e.en}
            </option>
          ))}
        </select>
        <MapPin className="h-2.5 w-2.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      </div>
      <div className="relative">
        <select
          value={sort}
          onChange={(e) => push({ sort: e.target.value })}
          suppressHydrationWarning
          className="appearance-none flex items-center gap-1 h-7 pl-6 pr-6 rounded-full bg-white border border-[#E7E4DA] text-[10px] text-secondary hover:border-[#141414]/30 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 cursor-pointer"
        >
          {Object.entries(SORT_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        <ArrowUpDown className="h-2.5 w-2.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      </div>
    </div>
  );
}
