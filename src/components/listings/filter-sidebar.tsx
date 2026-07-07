"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ChevronDown, RotateCw, SlidersHorizontal } from "lucide-react";
import {
  popularMakes,
  bodyTypes,
  fuelTypes,
  transmissions,
  regionalSpecs,
  emirates,
} from "@/lib/brand";
import { cn } from "@/lib/utils";
import { useQueryState } from "@/lib/use-query-state";

interface Facet {
  value: string;
  count: number;
}
interface Facets {
  makes: Facet[];
  bodyTypes: Facet[];
  emirates: Facet[];
  fuels: Facet[];
}

function FilterGroup({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#E5E5E5] py-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="mt-2.5 space-y-1.5">{children}</div>}
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="flex items-center gap-1.5 text-xs text-secondary group-hover:text-[#1A1A1A]">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={(e) => onChange?.(e.target.checked)}
          suppressHydrationWarning
          className="h-3 w-3 rounded-sm border-[#D4D4D4] bg-transparent text-[#C8A93E] focus:ring-[#C8A93E]/40"
        />
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[9px] text-muted">{count}</span>
      )}
    </label>
  );
}

export function FilterSidebar({
  className,
  facets,
}: {
  className?: string;
  facets?: Facets;
}) {
  const t = useTranslations("filters");
  const { params, push } = useQueryState();

  // Draft state seeded from the URL; committed on Apply.
  const [makes, setMakes] = useState<string[]>([]);
  const [emirateSel, setEmirateSel] = useState<string[]>([]);
  const [body, setBody] = useState<string[]>([]);
  const [fuel, setFuel] = useState<string[]>([]);
  const [trans, setTrans] = useState<string[]>([]);
  const [spec, setSpec] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [inspectedOnly, setInspectedOnly] = useState(false);
  const [exportOnly, setExportOnly] = useState(false);

  // Re-seed whenever the URL changes (back/forward, links).
  useEffect(() => {
    setMakes(params.getAll("make"));
    setEmirateSel(params.getAll("emirate"));
    setBody(params.getAll("bodyType"));
    setFuel(params.getAll("fuel"));
    setTrans(params.getAll("transmission"));
    setSpec(params.getAll("regionalSpec"));
    setPriceMin(params.get("priceMin") ?? "");
    setPriceMax(params.get("priceMax") ?? "");
    setYearMin(params.get("yearMin") ?? "");
    setYearMax(params.get("yearMax") ?? "");
    setInspectedOnly(params.get("inspected") === "true");
    setExportOnly(params.get("exportReady") === "true");
  }, [params]);

  const toggle =
    (list: string[], setter: (v: string[]) => void) => (m: string) =>
      setter(
        list.includes(m) ? list.filter((x) => x !== m) : [...list, m],
      );

  const apply = () => {
    push({
      make: makes,
      emirate: emirateSel,
      bodyType: body,
      fuel,
      transmission: trans,
      regionalSpec: spec,
      priceMin: priceMin || null,
      priceMax: priceMax || null,
      yearMin: yearMin || null,
      yearMax: yearMax || null,
      inspected: inspectedOnly ? "true" : null,
      exportReady: exportOnly ? "true" : null,
    });
  };

  const reset = () => {
    push({
      make: null,
      emirate: null,
      bodyType: null,
      fuel: null,
      transmission: null,
      regionalSpec: null,
      priceMin: null,
      priceMax: null,
      yearMin: null,
      yearMax: null,
      inspected: null,
      exportReady: null,
      q: null,
    });
  };

  const countFor = (arr: Facet[] | undefined, value: string) =>
    arr?.find((f) => f.value.toLowerCase() === value.toLowerCase())?.count;

  return (
    <aside className={cn("w-full", className)}>
      <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3 w-3 text-[#C8A93E]" />
            <span className="text-xs font-semibold">{t("title")}</span>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1 text-[10px] text-muted hover:text-[#1A1A1A]"
          >
            <RotateCw className="h-2.5 w-2.5" />
            {t("reset")}
          </button>
        </div>

        <div className="px-4 max-h-[calc(100vh-180px)] overflow-y-auto">
          <FilterGroup title={t("emirate")}>
            {emirates.map((e) => (
              <CheckRow
                key={e.id}
                label={e.en}
                count={countFor(facets?.emirates, e.en)}
                checked={emirateSel.includes(e.en)}
                onChange={() => toggle(emirateSel, setEmirateSel)(e.en)}
              />
            ))}
          </FilterGroup>

          <FilterGroup title={t("make")}>
            {popularMakes.slice(0, 12).map((m) => (
              <CheckRow
                key={m}
                label={m}
                count={countFor(facets?.makes, m)}
                checked={makes.includes(m)}
                onChange={() => toggle(makes, setMakes)(m)}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Price (AED)">
            <div className="grid grid-cols-2 gap-1.5">
              <input
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                placeholder="Min"
                inputMode="numeric"
                suppressHydrationWarning
                className="h-7 rounded-sm bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder:text-muted px-2 focus:outline-none focus:border-[#C8A93E]"
              />
              <input
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                placeholder="Max"
                inputMode="numeric"
                suppressHydrationWarning
                className="h-7 rounded-sm bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder:text-muted px-2 focus:outline-none focus:border-[#C8A93E]"
              />
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {[50000, 100000, 200000, 500000].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriceMax(String(p))}
                  className="text-[10px] px-1.5 py-0.5 rounded-sm bg-[#F4F4F4] border border-[#E5E5E5] text-secondary hover:border-[#C8A93E]/40"
                >
                  &lt; {p / 1000}k
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title="Year">
            <div className="grid grid-cols-2 gap-1.5">
              <input
                value={yearMin}
                onChange={(e) => setYearMin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                placeholder="From"
                inputMode="numeric"
                suppressHydrationWarning
                className="h-7 rounded-sm bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder:text-muted px-2 focus:outline-none focus:border-[#C8A93E]"
              />
              <input
                value={yearMax}
                onChange={(e) => setYearMax(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                placeholder="To"
                inputMode="numeric"
                suppressHydrationWarning
                className="h-7 rounded-sm bg-white border border-[#E5E5E5] text-xs text-[#1A1A1A] placeholder:text-muted px-2 focus:outline-none focus:border-[#C8A93E]"
              />
            </div>
          </FilterGroup>

          <FilterGroup title={t("bodyType")}>
            {bodyTypes.map((b) => (
              <CheckRow
                key={b}
                label={b}
                count={countFor(facets?.bodyTypes, b)}
                checked={body.includes(b)}
                onChange={() => toggle(body, setBody)(b)}
              />
            ))}
          </FilterGroup>

          <FilterGroup title={t("fuel")}>
            {fuelTypes.map((f) => (
              <CheckRow
                key={f}
                label={f}
                count={countFor(facets?.fuels, f)}
                checked={fuel.includes(f)}
                onChange={() => toggle(fuel, setFuel)(f)}
              />
            ))}
          </FilterGroup>

          <FilterGroup title={t("transmission")} defaultOpen={false}>
            {transmissions.map((tr) => (
              <CheckRow
                key={tr}
                label={tr}
                checked={trans.includes(tr)}
                onChange={() => toggle(trans, setTrans)(tr)}
              />
            ))}
          </FilterGroup>

          <FilterGroup title={t("regionalSpec")} defaultOpen={false}>
            {regionalSpecs.map((r) => (
              <CheckRow
                key={r}
                label={r}
                checked={spec.includes(r)}
                onChange={() => toggle(spec, setSpec)(r)}
              />
            ))}
          </FilterGroup>

          <div className="py-3 space-y-2">
            <CheckRow
              label={t("inspectedOnly")}
              checked={inspectedOnly}
              onChange={setInspectedOnly}
            />
            <CheckRow
              label={t("exportReady")}
              checked={exportOnly}
              onChange={setExportOnly}
            />
          </div>
        </div>

        <div className="p-3 border-t border-[#E5E5E5]">
          <button
            onClick={apply}
            className="w-full h-9 rounded-lg bg-[#C8A93E] text-white text-xs font-semibold hover:bg-[#B4972F] transition-colors"
          >
            {t("apply")}
          </button>
        </div>
      </div>
    </aside>
  );
}
