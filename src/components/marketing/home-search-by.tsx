"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Loader2 } from "lucide-react";
import { emirates, makeModels } from "@/lib/brand";
import { LabeledSelect } from "@/components/ui/labeled-select";

interface Facet {
  value: string;
  count: number;
}

/**
 * cars.com-style structured search: a vertically joined stack of labelled
 * selects (condition → make → model → emirate) with a full-width violet CTA
 * that shows the live match count before you commit to the results page.
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
    <div>
      {/* Joined vertical stack — one grouped widget, cars.com style */}
      <div className="rounded-md border border-[#D9D9E0] bg-white divide-y divide-[#D9D9E0] overflow-hidden [&>div>div]:border-0">
        <LabeledSelect
          joined
          label="New/used"
          value={condition}
          onChange={setCondition}
          placeholder="New & used"
          options={[
            { value: "New", label: "New" },
            { value: "Used", label: "Used" },
            { value: "Certified Pre-Owned", label: "Certified Pre-Owned" },
          ]}
        />
        <LabeledSelect
          joined
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
        <LabeledSelect
          joined
          label="Model"
          value={model}
          onChange={setModel}
          disabled={!make}
          placeholder={make ? "All models" : "All models"}
          options={modelOptions}
        />
        <LabeledSelect
          joined
          label="Emirate"
          value={emirate}
          onChange={setEmirate}
          placeholder="All emirates"
          options={emirates.map((e) => ({ value: e.en, label: e.en }))}
        />
      </div>

      <button
        onClick={go}
        suppressHydrationWarning
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#8136B2] text-sm font-semibold text-white transition-colors hover:bg-[#6B21A8]"
      >
        {loading && total === null ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>Show {total?.toLocaleString() ?? 0} matches</>
        )}
      </button>
    </div>
  );
}
