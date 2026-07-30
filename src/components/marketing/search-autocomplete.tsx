"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "@/i18n/routing";
import { popularMakes, makeModels } from "@/lib/brand";
import { formatAED } from "@/lib/utils";
import { Search, TrendingUp, Loader2, ArrowUpRight, Car } from "lucide-react";

/** Flat make/model index, built once — powers instant type-ahead. */
type IndexEntry = { label: string; href: string; type: "make" | "model" };
const INDEX: IndexEntry[] = (() => {
  const out: IndexEntry[] = [];
  for (const make of Object.keys(makeModels)) {
    out.push({ label: make, href: `/buy?make=${encodeURIComponent(make)}`, type: "make" });
    for (const model of makeModels[make]) {
      out.push({
        label: `${make} ${model}`,
        href: `/buy?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`,
        type: "model",
      });
    }
  }
  return out;
})();

interface Hit {
  id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  priceAED: number;
  imageUrl: string;
}

/**
 * Type-ahead car search: instant make/model suggestions from the catalog,
 * live matching listings (debounced), popular-make recommendations on an empty
 * box, and full keyboard navigation. Submits to the /buy results page.
 */
export function SearchAutocomplete({
  autoFocus,
  onNavigate,
  placeholder = "Search make, model, or keyword…",
}: {
  autoFocus?: boolean;
  onNavigate?: () => void;
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const term = q.trim();

  const suggestions = useMemo(() => {
    const t = term.toLowerCase();
    if (!t) return [];
    return INDEX.filter((i) => i.label.toLowerCase().includes(t))
      .sort((a, b) => {
        const aStarts = a.label.toLowerCase().startsWith(t) ? 0 : 1;
        const bStarts = b.label.toLowerCase().startsWith(t) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return (a.type === "make" ? 0 : 1) - (b.type === "make" ? 0 : 1);
      })
      .slice(0, 6);
  }, [term]);

  // Debounced live listing search.
  useEffect(() => {
    if (term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        const d = await res.json();
        setHits((d.hits ?? []).slice(0, 4));
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [term]);

  // Flat list of navigable options (for keyboard nav + enter).
  const options: { href: string }[] = useMemo(() => {
    const base = term ? [{ href: `/buy?q=${encodeURIComponent(term)}` }] : [];
    return [
      ...base,
      ...suggestions.map((s) => ({ href: s.href })),
      ...hits.map((h) => ({ href: `/listings/${h.id}/${h.slug}` })),
    ];
  }, [term, suggestions, hits]);

  useEffect(() => setActive(0), [term]);

  const go = (href: string) => {
    router.push(href);
    onNavigate?.();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(options.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (options[active]) go(options[active].href);
      else if (term) go(`/buy?q=${encodeURIComponent(term)}`);
    }
  };

  // Index offsets so highlight maps to the flat options array.
  const queryOffset = term ? 1 : 0;
  const hitsOffset = queryOffset + suggestions.length;

  return (
    <div>
      <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-[#F4F4F6] border border-transparent focus-within:border-[#8136B2]/40 focus-within:bg-white">
        <Search className="h-4 w-4 text-[#8136B2] flex-shrink-0" />
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-[#141414] placeholder:text-muted focus:outline-none"
        />
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted flex-shrink-0" />}
      </div>

      <div className="mt-2 max-h-[60vh] overflow-y-auto">
        {/* Empty state — popular makes as recommendations */}
        {!term && (
          <div className="px-1 py-1">
            <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              Popular makes
            </div>
            <div className="flex flex-wrap gap-1.5 px-1">
              {popularMakes.slice(0, 8).map((m) => (
                <button
                  key={m}
                  onClick={() => go(`/buy?make=${encodeURIComponent(m)}`)}
                  className="px-2.5 py-1 rounded-full bg-[#F4F4F6] text-xs text-[#141414] hover:bg-[#F3EDF9] hover:text-[#8136B2] transition-colors"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* "Search for" primary action */}
        {term && (
          <button
            onMouseEnter={() => setActive(0)}
            onClick={() => go(`/buy?q=${encodeURIComponent(term)}`)}
            className={`flex w-full items-center gap-2.5 px-2.5 py-2 rounded-lg text-left ${
              active === 0 ? "bg-[#F3EDF9]" : "hover:bg-[#F4F4F6]"
            }`}
          >
            <Search className="h-4 w-4 text-[#8136B2]" />
            <span className="text-sm text-[#141414]">
              Search for “<span className="font-semibold">{term}</span>”
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted ml-auto" />
          </button>
        )}

        {/* Make / model suggestions */}
        {suggestions.map((s, i) => (
          <button
            key={s.href}
            onMouseEnter={() => setActive(queryOffset + i)}
            onClick={() => go(s.href)}
            className={`flex w-full items-center gap-2.5 px-2.5 py-2 rounded-lg text-left ${
              active === queryOffset + i ? "bg-[#F3EDF9]" : "hover:bg-[#F4F4F6]"
            }`}
          >
            <Car className="h-4 w-4 text-muted" />
            <span className="text-sm text-[#141414]">{s.label}</span>
            <span className="ml-auto text-[10px] uppercase tracking-wide text-muted">
              {s.type}
            </span>
          </button>
        ))}

        {/* Matching listings */}
        {hits.length > 0 && (
          <>
            <div className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
              Matching cars
            </div>
            {hits.map((h, i) => (
              <button
                key={h.id}
                onMouseEnter={() => setActive(hitsOffset + i)}
                onClick={() => go(`/listings/${h.id}/${h.slug}`)}
                className={`flex w-full items-center gap-2.5 px-2 py-1.5 rounded-lg text-left ${
                  active === hitsOffset + i ? "bg-[#F3EDF9]" : "hover:bg-[#F4F4F6]"
                }`}
              >
                <span className="relative h-9 w-12 rounded-md overflow-hidden bg-[#F4F4F6] flex-shrink-0">
                  <Image src={h.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-[#141414] truncate">
                    {h.year} {h.make} {h.model}
                  </span>
                  <span className="block text-xs text-[#8136B2] font-bold">
                    {formatAED(h.priceAED)}
                  </span>
                </span>
              </button>
            ))}
          </>
        )}

        {/* No results */}
        {term.length >= 2 && !loading && suggestions.length === 0 && hits.length === 0 && (
          <div className="px-3 py-6 text-center">
            <TrendingUp className="h-5 w-5 text-muted mx-auto mb-1.5" />
            <p className="text-xs text-muted">
              No matches — press Enter to search all cars for “{term}”.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
