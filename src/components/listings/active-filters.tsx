"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useQueryState } from "@/lib/use-query-state";

/** Multi-value params rendered as one chip per selected value. */
const MULTI_KEYS = [
  "make",
  "model",
  "trim",
  "emirate",
  "bodyType",
  "fuel",
  "transmission",
  "drivetrain",
  "regionalSpec",
  "condition",
  "dealRating",
  "color",
  "interiorColor",
  "cylinders",
  "doors",
] as const;

/** Deal-rating stores an id ("Great"); show the friendly label on the chip. */
const DEAL_RATING_LABEL: Record<string, string> = {
  Great: "Great Deal",
  Good: "Good Deal",
  Fair: "Fair Price",
};

/** Single-value params rendered as one chip with a formatted label. */
const SINGLE_LABELS: Record<string, (v: string) => string> = {
  q: (v) => `“${v}”`,
  sellerType: (v) => (v === "private" ? "Private Seller" : "Dealership"),
  priceMin: (v) => `Min AED ${Number(v).toLocaleString()}`,
  priceMax: (v) => `Max AED ${Number(v).toLocaleString()}`,
  yearMin: (v) => `From ${v}`,
  yearMax: (v) => `To ${v}`,
  kmsMax: (v) => `< ${Number(v).toLocaleString()} km`,
  inspected: () => "Inspected",
  exportReady: () => "Export ready",
  withPhotos: () => "With photos",
};

/** How many filters are currently applied — drives the mobile "Filters (N)" badge. */
export function useActiveFilterCount() {
  const { params, getAll } = useQueryState();
  let n = 0;
  for (const key of MULTI_KEYS) n += getAll(key).length;
  for (const key of Object.keys(SINGLE_LABELS)) if (params.get(key)) n += 1;
  return n;
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="flex items-center gap-1 h-6 pl-2.5 pr-1.5 rounded-full bg-[#141414] text-[10px] font-semibold text-white hover:bg-[#141414]/85 transition-colors"
    >
      {label}
      <X className="h-2.5 w-2.5" />
    </button>
  );
}

export function ActiveFilters() {
  const t = useTranslations("filters");
  const { params, getAll, push } = useQueryState();

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  for (const key of MULTI_KEYS) {
    const values = getAll(key);
    for (const v of values) {
      chips.push({
        key: `${key}:${v}`,
        label: key === "dealRating" ? (DEAL_RATING_LABEL[v] ?? v) : v,
        onRemove: () =>
          push({ [key]: getAll(key).filter((x) => x !== v) }),
      });
    }
  }

  for (const [key, fmt] of Object.entries(SINGLE_LABELS)) {
    const v = params.get(key);
    if (v) {
      chips.push({
        key,
        label: fmt(v),
        onRemove: () => push({ [key]: null }),
      });
    }
  }

  if (chips.length === 0) return null;

  const clearAll = () => {
    const patch: Record<string, null> = {};
    for (const key of MULTI_KEYS) patch[key] = null;
    for (const key of Object.keys(SINGLE_LABELS)) patch[key] = null;
    push(patch);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-3">
      {chips.map((c) => (
        <Chip key={c.key} label={c.label} onRemove={c.onRemove} />
      ))}
      {chips.length > 1 && (
        <button
          onClick={clearAll}
          className="text-[10px] text-muted hover:text-[#141414] underline underline-offset-2 ml-1"
        >
          {t("clearAll")}
        </button>
      )}
    </div>
  );
}
