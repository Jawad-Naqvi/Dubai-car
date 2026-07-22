"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { ChevronDown, Loader2 } from "lucide-react";
import { emirates, makeModels } from "@/lib/brand";

interface Facet {
  value: string;
  count: number;
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1 min-w-0">
      <div className="rounded-xl border border-[#E7E4DA] bg-white px-3 pt-2 pb-1.5 focus-within:border-[#F0941F] transition-colors">
        <label className="block text-[10px] font-medium text-muted">{label}</label>
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          suppressHydrationWarning
          className="w-full appearance-none bg-transparent pe-5 text-sm font-semibold text-[#141414] outline-none disabled:text-muted cursor-pointer truncate"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <ChevronDown className="pointer-events-none absolute end-3 bottom-2.5 h-4 w-4 text-muted" />
    </div>
  );
}

/**
 * cars.com-style structured search: pick condition / make / model / emirate and
 * the CTA shows the live match count before you commit to the results page.
 * Counts come from the same /api/search facets the listings page uses.
 */
export function HomeSearchBy() {
  const router = useRouter();

  const [condition, setCondition] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [emirate, setEmirate] = useState("");

  const [makes, setMakes] = useState<Facet[]>([]);
  const [models, setModels] = useState<Facet[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (condition) sp.set("condition", condition);
    if (make) sp.set("make", make);
    if (model) sp.set("model", model);
    if (emirate) sp.set("emirate", emirate);
    return sp;
  }, [condition, make, model, emirate]);

  // Live count + option lists for the current selection.
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    const id = setTimeout(() => {
      fetch(`/api/search?${query.toString()}&perPage=1`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => {
          setTotal(d.total ?? 0);
          setMakes(d.facets?.makes ?? []);
          setModels(d.facets?.models ?? []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [query]);

  // Full lineup for the chosen make (catalogue), with in-stock counts merged.
  const modelOptions = useMemo(() => {
    if (!make) return [];
    const counts = new Map(models.map((m) => [m.value.toLowerCase(), m.count]));
    const catalog = makeModels[make] ?? [];
    const inStock = models.map((m) => m.value);
    const names = Array.from(new Set([...catalog, ...inStock]));
    return names.map((value) => ({
      value,
      label: counts.get(value.toLowerCase())
        ? `${value} (${counts.get(value.toLowerCase())})`
        : value,
    }));
  }, [make, models]);

  // Switching make invalidates a model that no longer belongs to it.
  useEffect(() => {
    if (model && make && !(makeModels[make] ?? []).includes(model) &&
        !models.some((m) => m.value === model))
      setModel("");
  }, [make, models, model]);

  const go = () => router.push(`/buy?${query.toString()}`);

  return (
    <div className="rounded-2xl border border-[#E7E4DA] bg-white/80 backdrop-blur p-3 shadow-card">
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Select
            label="Condition"
            value={condition}
            onChange={setCondition}
            placeholder="New & used"
            options={[
              { value: "New", label: "New" },
              { value: "Used", label: "Used" },
              { value: "Certified Pre-Owned", label: "Certified Pre-Owned" },
            ]}
          />
          <Select
            label="Emirate"
            value={emirate}
            onChange={setEmirate}
            placeholder="All emirates"
            options={emirates.map((e) => ({ value: e.en, label: e.en }))}
          />
        </div>

        <div className="flex gap-2">
          <Select
            label="Make"
            value={make}
            onChange={(v) => {
              setMake(v);
              setModel("");
            }}
            placeholder="All makes"
            options={makes.map((m) => ({
              value: m.value,
              label: `${m.value} (${m.count})`,
            }))}
          />
          <Select
            label="Model"
            value={model}
            onChange={setModel}
            disabled={!make}
            placeholder={make ? "All models" : "Select a make"}
            options={modelOptions}
          />
        </div>

        <button
          onClick={go}
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#141414] text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {loading && total === null ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>Show {total?.toLocaleString() ?? 0} matches</>
          )}
        </button>
      </div>
    </div>
  );
}
