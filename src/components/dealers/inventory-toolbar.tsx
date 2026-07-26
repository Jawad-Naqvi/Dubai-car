"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { useQueryState } from "@/lib/use-query-state";
import { LabeledSelect } from "@/components/ui/labeled-select";

const SORT_LABELS: Record<string, string> = {
  newest: "Newest first",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  year_desc: "Year: newest",
  kms_asc: "Mileage: lowest",
};

/**
 * cars.com dealer-inventory controls: a row of labelled select boxes
 * (make / sort) plus keyword search, writing the URL params the storefront
 * page parses (q, make, sort, page) so results stay shareable.
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

  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {makes.length > 1 && (
        <LabeledSelect
          className="w-44"
          label="Makes"
          value={make}
          onChange={(v) => push({ make: v || null })}
          placeholder="All makes"
          options={makes.map((m) => ({
            value: m.value,
            label: `${m.value} (${m.count})`,
          }))}
        />
      )}

      <LabeledSelect
        className="w-48"
        label="Sort by"
        value={sort}
        onChange={(v) => push({ sort: v === "newest" ? null : v })}
        options={Object.entries(SORT_LABELS).map(([k, label]) => ({
          value: k,
          label,
        }))}
      />

      {/* Keyword search within this dealer's stock */}
      <div className="flex items-center gap-1.5 flex-1 min-w-[200px] bg-white border border-[#D9D9E0] rounded-md px-3 focus-within:border-[#8136B2] focus-within:ring-1 focus-within:ring-[#8136B2] transition-colors">
        <Search className="h-3.5 w-3.5 text-[#63666A] flex-shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && push({ q: value || null })}
          placeholder="Search this dealer's inventory"
          suppressHydrationWarning
          className="flex-1 bg-transparent text-[#141414] placeholder:text-muted text-sm outline-none min-w-0 py-2.5"
        />
        {value && (
          <button
            onClick={() => {
              setValue("");
              push({ q: null });
            }}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5 text-muted hover:text-[#141414]" />
          </button>
        )}
      </div>
    </div>
  );
}
