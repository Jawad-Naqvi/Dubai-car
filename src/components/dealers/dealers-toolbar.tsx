"use client";

import { useState } from "react";
import {
  Search,
  ArrowUpDown,
  MapPin,
  Star,
  BadgeCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryState } from "@/lib/use-query-state";
import { emirates } from "@/lib/brand";
import { cn } from "@/lib/utils";

export const DEALER_SORT_LABELS: Record<string, string> = {
  recommended: "Recommended",
  rating_desc: "Highest rated",
  reviews_desc: "Most reviewed",
  inventory_desc: "Largest inventory",
  name_asc: "Name: A to Z",
};

const RATING_OPTIONS = [
  { value: "", label: "Any rating" },
  { value: "4.5", label: "4.5 stars & up" },
  { value: "4", label: "4.0 stars & up" },
  { value: "3.5", label: "3.5 stars & up" },
];

export function DealerSearchBar({ className }: { className?: string }) {
  const { get, push } = useQueryState();
  const [value, setValue] = useState(get("q") ?? "");

  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 bg-white border border-[#E5E5EA] rounded-full shadow-card p-1 pl-3">
        <Search className="h-3.5 w-3.5 text-[#8136B2]" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && push({ q: value || null })}
          placeholder="Search dealers by name or speciality"
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

const selectClass =
  "appearance-none flex items-center gap-1 h-7 pl-6 pr-6 rounded-full bg-white border border-[#E5E5EA] text-[10px] text-secondary hover:border-[#141414]/30 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 cursor-pointer";

export function DealerFilterSortBar() {
  const { get, push } = useQueryState();
  const emirate = get("emirate") ?? "";
  const rating = get("rating") ?? "";
  const verified = get("verified") === "1";
  const sort = get("sort") ?? "recommended";

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <div className="relative">
        <select
          value={emirate}
          onChange={(e) => push({ emirate: e.target.value || null })}
          suppressHydrationWarning
          className={selectClass}
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
          value={rating}
          onChange={(e) => push({ rating: e.target.value || null })}
          suppressHydrationWarning
          className={selectClass}
        >
          {RATING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Star className="h-2.5 w-2.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      </div>

      <button
        onClick={() => push({ verified: verified ? null : "1" })}
        suppressHydrationWarning
        className={cn(
          "inline-flex items-center gap-1 h-7 px-3 rounded-full border text-[10px] font-medium transition-colors",
          verified
            ? "bg-[#141414] text-white border-[#141414]"
            : "bg-white text-secondary border-[#E5E5EA] hover:border-[#141414]/30",
        )}
      >
        <BadgeCheck className="h-3 w-3" />
        Verified only
      </button>

      <div className="relative">
        <select
          value={sort}
          onChange={(e) =>
            push({ sort: e.target.value === "recommended" ? null : e.target.value })
          }
          suppressHydrationWarning
          className={selectClass}
        >
          {Object.entries(DEALER_SORT_LABELS).map(([k, label]) => (
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

/** Removable chips for every active directory filter, plus "Clear all". */
export function DealerActiveFilters() {
  const { get, push } = useQueryState();

  const chips: { key: string; label: string }[] = [];
  const q = get("q");
  const emirate = get("emirate");
  const rating = get("rating");
  const verified = get("verified") === "1";

  if (q) chips.push({ key: "q", label: `"${q}"` });
  if (emirate) chips.push({ key: "emirate", label: emirate });
  if (rating) chips.push({ key: "rating", label: `${rating}+ stars` });
  if (verified) chips.push({ key: "verified", label: "Verified" });

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-4">
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={() => push({ [c.key]: null })}
          className="inline-flex items-center gap-1 h-6 pl-2.5 pr-1.5 rounded-full bg-[#F4F4F6] border border-[#E5E5EA] text-[10px] text-[#141414] font-medium hover:border-[#141414]/30 transition-colors"
        >
          {c.label}
          <X className="h-2.5 w-2.5 text-muted" />
        </button>
      ))}
      <button
        onClick={() =>
          push({ q: null, emirate: null, rating: null, verified: null })
        }
        className="text-[10px] text-muted underline underline-offset-2 hover:text-[#141414] transition-colors ml-1"
      >
        Clear all
      </button>
    </div>
  );
}
