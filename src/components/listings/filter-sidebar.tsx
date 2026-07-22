"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, RotateCw, SlidersHorizontal } from "lucide-react";
import {
  popularMakes,
  bodyTypes,
  fuelTypes,
  transmissions,
  drivetrains,
  dealRatings,
  regionalSpecs,
  emirates,
  conditions,
  exteriorColors,
  interiorColors,
  cylinderOptions,
  doorOptions,
  sellerTypes,
  mileagePresets,
  type ColorOption,
} from "@/lib/brand";
import { modelGroupsForMakes } from "@/lib/car-models";
import { cn } from "@/lib/utils";
import { useQueryState } from "@/lib/use-query-state";

interface Facet {
  value: string;
  count: number;
}
export interface Facets {
  makes: Facet[];
  models?: Facet[];
  trims?: Facet[];
  bodyTypes: Facet[];
  emirates: Facet[];
  fuels: Facet[];
  drivetrains?: Facet[];
  colors: Facet[];
  conditions: Facet[];
  dealRatings?: Facet[];
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
    <div className="border-b border-[#E7E4DA] py-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#141414]">
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
      <span className="flex items-center gap-1.5 text-xs text-secondary group-hover:text-[#141414]">
        <input
          type="checkbox"
          checked={!!checked}
          onChange={(e) => onChange?.(e.target.checked)}
          suppressHydrationWarning
          className="h-3 w-3 rounded-sm border-[#D8D4C6] bg-transparent text-[#141414] focus:ring-[#141414]/20"
        />
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[9px] text-muted">{count}</span>
      )}
    </label>
  );
}

/** cars.com-style colour row: a swatch + name + count. */
function ColorRow({
  color,
  count,
  checked,
  onChange,
}: {
  color: ColorOption;
  count?: number;
  checked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="flex items-center gap-2 text-xs text-secondary group-hover:text-[#141414]">
        <span
          className={cn(
            "relative h-4 w-4 rounded-full border flex items-center justify-center",
            color.light ? "border-[#D8D4C6]" : "border-transparent",
          )}
          style={{ backgroundColor: color.hex }}
        >
          {checked && (
            <Check
              className={cn(
                "h-2.5 w-2.5",
                color.light ? "text-[#141414]" : "text-white",
              )}
              strokeWidth={3}
            />
          )}
        </span>
        {color.name}
      </span>
      {count !== undefined && (
        <span className="text-[9px] text-muted">{count}</span>
      )}
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange?.(e.target.checked)}
        suppressHydrationWarning
        className="sr-only"
      />
    </label>
  );
}

/** Compact toggle pill used for cylinders / doors. */
function Pill({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-[11px] px-3 py-1 rounded-full border transition-colors",
        active
          ? "bg-[#141414] border-[#141414] text-white"
          : "bg-white border-[#141414]/20 text-[#141414] hover:bg-[#141414] hover:text-white",
      )}
    >
      {label}
    </button>
  );
}

const inputCls =
  "h-7 rounded-lg bg-white border border-[#E7E4DA] text-xs text-[#141414] placeholder:text-muted px-2 focus:outline-none focus:border-[#141414]/40 focus:ring-2 focus:ring-[#141414]/10";

export function FilterSidebar({
  className,
  facets,
  total,
  onApplied,
}: {
  className?: string;
  facets?: Facets;
  total?: number;
  /** Called after Apply/Reset commits — lets the mobile drawer close itself. */
  onApplied?: () => void;
}) {
  const t = useTranslations("filters");
  const { params, push } = useQueryState();

  // Draft state seeded from the URL; committed on Apply.
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [trimSel, setTrimSel] = useState<string[]>([]);
  const [emirateSel, setEmirateSel] = useState<string[]>([]);
  const [body, setBody] = useState<string[]>([]);
  const [fuel, setFuel] = useState<string[]>([]);
  const [trans, setTrans] = useState<string[]>([]);
  const [drivetrainSel, setDrivetrainSel] = useState<string[]>([]);
  const [dealRatingSel, setDealRatingSel] = useState<string[]>([]);
  const [spec, setSpec] = useState<string[]>([]);
  const [condition, setCondition] = useState<string[]>([]);
  const [color, setColor] = useState<string[]>([]);
  const [intColor, setIntColor] = useState<string[]>([]);
  const [cylinders, setCylinders] = useState<string[]>([]);
  const [doors, setDoors] = useState<string[]>([]);
  const [sellerType, setSellerType] = useState<string>("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [kmsMax, setKmsMax] = useState("");
  const [keyword, setKeyword] = useState("");
  const [inspectedOnly, setInspectedOnly] = useState(false);
  const [exportOnly, setExportOnly] = useState(false);
  const [withPhotos, setWithPhotos] = useState(false);
  const [showAllMakes, setShowAllMakes] = useState(false);
  const [showAllModels, setShowAllModels] = useState(false);
  const [modelQuery, setModelQuery] = useState("");

  // Re-seed whenever the URL changes (back/forward, links).
  useEffect(() => {
    setMakes(params.getAll("make"));
    setModels(params.getAll("model"));
    setTrimSel(params.getAll("trim"));
    setEmirateSel(params.getAll("emirate"));
    setBody(params.getAll("bodyType"));
    setFuel(params.getAll("fuel"));
    setTrans(params.getAll("transmission"));
    setDrivetrainSel(params.getAll("drivetrain"));
    setDealRatingSel(params.getAll("dealRating"));
    setSpec(params.getAll("regionalSpec"));
    setCondition(params.getAll("condition"));
    setColor(params.getAll("color"));
    setIntColor(params.getAll("interiorColor"));
    setCylinders(params.getAll("cylinders"));
    setDoors(params.getAll("doors"));
    setSellerType(params.get("sellerType") ?? "");
    setPriceMin(params.get("priceMin") ?? "");
    setPriceMax(params.get("priceMax") ?? "");
    setYearMin(params.get("yearMin") ?? "");
    setYearMax(params.get("yearMax") ?? "");
    setKmsMax(params.get("kmsMax") ?? "");
    setKeyword(params.get("q") ?? "");
    setInspectedOnly(params.get("inspected") === "true");
    setExportOnly(params.get("exportReady") === "true");
    setWithPhotos(params.get("withPhotos") === "true");
  }, [params]);

  const toggle =
    (list: string[], setter: (v: string[]) => void) => (m: string) =>
      setter(
        list.includes(m) ? list.filter((x) => x !== m) : [...list, m],
      );

  const apply = () => {
    push({
      make: makes,
      // Drop any model no longer valid for the selected makes.
      model: models.filter((m) => validModels.has(m)),
      trim: trimSel,
      emirate: emirateSel,
      bodyType: body,
      fuel,
      transmission: trans,
      drivetrain: drivetrainSel,
      dealRating: dealRatingSel,
      regionalSpec: spec,
      condition,
      color,
      interiorColor: intColor,
      cylinders,
      doors,
      sellerType: sellerType || null,
      priceMin: priceMin || null,
      priceMax: priceMax || null,
      yearMin: yearMin || null,
      yearMax: yearMax || null,
      kmsMax: kmsMax || null,
      q: keyword || null,
      inspected: inspectedOnly ? "true" : null,
      exportReady: exportOnly ? "true" : null,
      withPhotos: withPhotos ? "true" : null,
    });
    onApplied?.();
  };

  const reset = () => {
    push({
      make: null,
      model: null,
      trim: null,
      emirate: null,
      bodyType: null,
      fuel: null,
      transmission: null,
      drivetrain: null,
      dealRating: null,
      regionalSpec: null,
      condition: null,
      color: null,
      interiorColor: null,
      cylinders: null,
      doors: null,
      sellerType: null,
      priceMin: null,
      priceMax: null,
      yearMin: null,
      yearMax: null,
      kmsMax: null,
      inspected: null,
      exportReady: null,
      withPhotos: null,
      q: null,
    });
    onApplied?.();
  };

  const countFor = (arr: Facet[] | undefined, value: string) =>
    arr?.find((f) => f.value.toLowerCase() === value.toLowerCase())?.count;

  // Merge inventory makes (with counts) and the curated popular list.
  const makeList = useMemo(() => {
    const fromFacets = facets?.makes?.map((f) => f.value) ?? [];
    return Array.from(new Set([...fromFacets, ...popularMakes]));
  }, [facets]);
  const visibleMakes = showAllMakes ? makeList : makeList.slice(0, 8);

  // Model catalog for the currently-selected (draft) makes. Grouped by make so
  // multi-make selections stay readable; each value is the bare model name.
  const modelGroups = useMemo(() => modelGroupsForMakes(makes), [makes]);
  const validModels = useMemo(
    () => new Set(modelGroups.flatMap((g) => g.models)),
    [modelGroups],
  );

  // Apply the model-search filter within each group, and collapse long lists.
  const MODEL_COLLAPSE = 10;
  const filteredGroups = useMemo(() => {
    const q = modelQuery.trim().toLowerCase();
    return modelGroups
      .map((g) => ({
        make: g.make,
        models: q
          ? g.models.filter((m) => m.toLowerCase().includes(q))
          : g.models,
      }))
      .filter((g) => g.models.length > 0);
  }, [modelGroups, modelQuery]);
  const totalFilteredModels = filteredGroups.reduce(
    (n, g) => n + g.models.length,
    0,
  );

  return (
    <aside className={cn("w-full", className)}>
      <div className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E7E4DA]">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3 w-3 text-[#F0941F]" />
            <span className="text-xs font-semibold">{t("title")}</span>
            {total !== undefined && (
              <span className="text-[10px] text-muted">
                · {total.toLocaleString()} {t("results")}
              </span>
            )}
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1 text-[10px] text-muted hover:text-[#141414]"
          >
            <RotateCw className="h-2.5 w-2.5" />
            {t("reset")}
          </button>
        </div>

        {/* In the drawer the parent already scrolls, so don't nest a scroller. */}
        <div
          className={cn(
            "px-4",
            !onApplied && "max-h-[calc(100vh-180px)] overflow-y-auto",
          )}
        >
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
            {visibleMakes.map((m) => (
              <CheckRow
                key={m}
                label={m}
                count={countFor(facets?.makes, m)}
                checked={makes.includes(m)}
                onChange={() => toggle(makes, setMakes)(m)}
              />
            ))}
            {makeList.length > 8 && (
              <button
                onClick={() => setShowAllMakes((v) => !v)}
                className="text-[10px] text-[#C97612] font-semibold hover:underline pt-0.5"
              >
                {showAllMakes ? t("showLess") : t("showMore")}
              </button>
            )}
          </FilterGroup>

          {makes.length > 0 && (
            <FilterGroup title={t("model")}>
              {modelGroups.length === 0 ? (
                <p className="text-[10px] text-muted">{t("modelNoCatalog")}</p>
              ) : (
                <>
                  {totalFilteredModels > MODEL_COLLAPSE && (
                    <input
                      value={modelQuery}
                      onChange={(e) => setModelQuery(e.target.value)}
                      placeholder={t("modelSearchPlaceholder")}
                      suppressHydrationWarning
                      className={cn(inputCls, "w-full mb-1")}
                    />
                  )}
                  {(() => {
                    // Cap the number of rendered rows across all groups until
                    // the user expands, so the list doesn't dominate the sidebar.
                    let budget = showAllModels ? Infinity : MODEL_COLLAPSE;
                    return filteredGroups.map((g) => {
                      if (budget <= 0) return null;
                      const shown = g.models.slice(0, budget);
                      budget -= shown.length;
                      return (
                        <div key={g.make} className="space-y-1.5">
                          {modelGroups.length > 1 && (
                            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider pt-1">
                              {g.make}
                            </p>
                          )}
                          {shown.map((m) => (
                            <CheckRow
                              key={`${g.make}:${m}`}
                              label={m}
                              checked={models.includes(m)}
                              onChange={() => toggle(models, setModels)(m)}
                            />
                          ))}
                        </div>
                      );
                    });
                  })()}
                  {totalFilteredModels > MODEL_COLLAPSE && (
                    <button
                      onClick={() => setShowAllModels((v) => !v)}
                      className="text-[10px] text-[#A98F2E] font-semibold hover:underline pt-0.5"
                    >
                      {showAllModels
                        ? t("showLess")
                        : `${t("showMore")} (${totalFilteredModels})`}
                    </button>
                  )}
                </>
              )}
            </FilterGroup>
          )}

          {/* Trim — dependent on model. */}
          {facets?.trims && facets.trims.length > 0 && models.length > 0 && (
            <FilterGroup title={t("trim")}>
              {facets.trims.map((tr) => (
                <CheckRow
                  key={tr.value}
                  label={tr.value}
                  count={tr.count}
                  checked={trimSel.includes(tr.value)}
                  onChange={() => toggle(trimSel, setTrimSel)(tr.value)}
                />
              ))}
            </FilterGroup>
          )}

          <FilterGroup title={t("condition")}>
            {conditions.map((c) => (
              <CheckRow
                key={c}
                label={c}
                count={countFor(facets?.conditions, c)}
                checked={condition.includes(c)}
                onChange={() => toggle(condition, setCondition)(c)}
              />
            ))}
          </FilterGroup>

          <FilterGroup title={t("dealRating")}>
            {dealRatings.map((d) => (
              <CheckRow
                key={d.id}
                label={d.label}
                count={countFor(facets?.dealRatings, d.id)}
                checked={dealRatingSel.includes(d.id)}
                onChange={() => toggle(dealRatingSel, setDealRatingSel)(d.id)}
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
                className={inputCls}
              />
              <input
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                placeholder="Max"
                inputMode="numeric"
                suppressHydrationWarning
                className={inputCls}
              />
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {[50000, 100000, 200000, 500000].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriceMax(String(p))}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-[#141414]/20 text-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
                >
                  &lt; {p / 1000}k
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title={t("mileage")}>
            <input
              value={kmsMax}
              onChange={(e) => setKmsMax(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder={t("mileageMax")}
              inputMode="numeric"
              suppressHydrationWarning
              className={cn(inputCls, "w-full")}
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {mileagePresets.map((p) => (
                <button
                  key={p}
                  onClick={() => setKmsMax(String(p))}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-[#141414]/20 text-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
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
                className={inputCls}
              />
              <input
                value={yearMax}
                onChange={(e) => setYearMax(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                placeholder="To"
                inputMode="numeric"
                suppressHydrationWarning
                className={inputCls}
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

          <FilterGroup title={t("color")}>
            {exteriorColors.map((c) => (
              <ColorRow
                key={c.name}
                color={c}
                count={countFor(facets?.colors, c.name)}
                checked={color.includes(c.name)}
                onChange={() => toggle(color, setColor)(c.name)}
              />
            ))}
          </FilterGroup>

          <FilterGroup title={t("interiorColor")} defaultOpen={false}>
            {interiorColors.map((c) => (
              <ColorRow
                key={c.name}
                color={c}
                checked={intColor.includes(c.name)}
                onChange={() => toggle(intColor, setIntColor)(c.name)}
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

          <FilterGroup title={t("transmission")}>
            {transmissions.map((tr) => (
              <CheckRow
                key={tr}
                label={tr}
                checked={trans.includes(tr)}
                onChange={() => toggle(trans, setTrans)(tr)}
              />
            ))}
          </FilterGroup>

          <FilterGroup title={t("drivetrain")}>
            {drivetrains.map((d) => (
              <CheckRow
                key={d}
                label={d}
                count={countFor(facets?.drivetrains, d)}
                checked={drivetrainSel.includes(d)}
                onChange={() => toggle(drivetrainSel, setDrivetrainSel)(d)}
              />
            ))}
          </FilterGroup>

          <FilterGroup title={t("cylinders")} defaultOpen={false}>
            <div className="flex flex-wrap gap-1.5">
              {cylinderOptions.map((c) => (
                <Pill
                  key={c}
                  label={String(c)}
                  active={cylinders.includes(String(c))}
                  onClick={() => toggle(cylinders, setCylinders)(String(c))}
                />
              ))}
            </div>
          </FilterGroup>

          <FilterGroup title={t("doors")} defaultOpen={false}>
            <div className="flex flex-wrap gap-1.5">
              {doorOptions.map((d) => (
                <Pill
                  key={d}
                  label={String(d)}
                  active={doors.includes(String(d))}
                  onClick={() => toggle(doors, setDoors)(String(d))}
                />
              ))}
            </div>
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

          <FilterGroup title={t("sellerType")} defaultOpen={false}>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-secondary hover:text-[#141414]">
              <input
                type="radio"
                name="sellerType"
                checked={sellerType === ""}
                onChange={() => setSellerType("")}
                suppressHydrationWarning
                className="h-3 w-3 border-[#D8D4C6] text-[#141414] focus:ring-[#141414]/20"
              />
              All
            </label>
            {sellerTypes.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-1.5 cursor-pointer text-xs text-secondary hover:text-[#141414]"
              >
                <input
                  type="radio"
                  name="sellerType"
                  checked={sellerType === s.id}
                  onChange={() => setSellerType(s.id)}
                  suppressHydrationWarning
                  className="h-3 w-3 border-[#D8D4C6] text-[#141414] focus:ring-[#141414]/20"
                />
                {s.label}
              </label>
            ))}
          </FilterGroup>

          <FilterGroup title={t("keyword")} defaultOpen={false}>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              placeholder={t("keywordPlaceholder")}
              suppressHydrationWarning
              className={cn(inputCls, "w-full")}
            />
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
            <CheckRow
              label={t("withPhotos")}
              checked={withPhotos}
              onChange={setWithPhotos}
            />
          </div>
        </div>

        <div className="p-3 border-t border-[#E7E4DA]">
          <button
            onClick={apply}
            className="w-full h-9 rounded-full bg-[#141414] text-white text-xs font-semibold hover:bg-[#141414]/90 transition-colors"
          >
            {t("apply")}
          </button>
        </div>
      </div>
    </aside>
  );
}
