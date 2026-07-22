"use client";

import { useState } from "react";
import { Search, ArrowUpDown, X } from "lucide-react";
import { useQueryState } from "@/lib/use-query-state";
import { cn } from "@/lib/utils";

const SORT_LABELS: Record<string, string> = {
  newest: "Newest first",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  year_desc: "Year: newest",
  kms_asc: "Mileage: lowest",
};

/**
 * Search / make-filter / sort controls scoped to a single dealer's inventory
 * on the storefront page. Writes the same URL params the page parses
 * (q, make, sort, page) so results stay shareable.
 */
export function InventoryToolbar({
  makes,
}: {
  makes: { value: string; count: number }[];
}) {
  const { get, push } = useQueryState();
  const [value, setValue] = useState(get("q") ?? "");
  const make = get("make") ?? "";
  const sort = get("sort") ?? "newest";
  const topMakes = makes.slice(0, 6);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search within this dealer's stock */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[200px] bg-white border border-[#E7E4DA] rounded-full px-3 h-9">
          <Search className="h-3.5 w-3.5 text-[#F0941F] flex-shrink-0" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && push({ q: value || null })}
            placeholder="Search this dealer's inventory"
            suppressHydrationWarning
            className="flex-1 bg-transparent text-[#141414] placeholder:text-muted text-xs outline-none min-w-0"
          />
          {value && (
            <button
              onClick={() => {
                setValue("");
                push({ q: null });
              }}
              aria-label="Clear search"
            >
              <X className="h-3 w-3 text-muted hover:text-[#141414]" />
            </button>
          )}
        </div>

        {/* Make select (full facet list) */}
        {makes.length > 1 && (
          <select
            value={make}
            onChange={(e) => push({ make: e.target.value || null })}
            suppressHydrationWarning
            className="appearance-none h-9 pl-3 pr-7 rounded-full bg-white border border-[#E7E4DA] text-xs text-secondary hover:border-[#141414]/30 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 cursor-pointer"
          >
            <option value="">All makes</option>
            {makes.map((m) => (
              <option key={m.value} value={m.value}>
                {m.value} ({m.count})
              </option>
            ))}
          </select>
        )}

        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) =>
              push({ sort: e.target.value === "newest" ? null : e.target.value })
            }
            suppressHydrationWarning
            className="appearance-none h-9 pl-8 pr-4 rounded-full bg-white border border-[#E7E4DA] text-xs text-secondary hover:border-[#141414]/30 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 cursor-pointer"
          >
            {Object.entries(SORT_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <ArrowUpDown className="h-3 w-3 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>
      </div>

      {/* Quick make chips for the most-stocked brands */}
      {topMakes.length > 1 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => push({ make: null })}
            className={cn(
              "h-7 px-3 rounded-full border text-[10px] font-medium transition-colors",
              !make
                ? "bg-[#141414] text-white border-[#141414]"
                : "bg-white text-secondary border-[#E7E4DA] hover:border-[#141414]/30",
            )}
          >
            All
          </button>
          {topMakes.map((m) => (
            <button
              key={m.value}
              onClick={() => push({ make: m.value === make ? null : m.value })}
              className={cn(
                "h-7 px-3 rounded-full border text-[10px] font-medium transition-colors",
                make === m.value
                  ? "bg-[#141414] text-white border-[#141414]"
                  : "bg-white text-secondary border-[#E7E4DA] hover:border-[#141414]/30",
              )}
            >
              {m.value}
              <span className="ml-1 opacity-60">{m.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
