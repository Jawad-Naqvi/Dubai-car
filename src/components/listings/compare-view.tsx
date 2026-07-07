"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { GitCompare, X, Trophy } from "lucide-react";
import { useCompare } from "@/lib/compare";
import { formatAED, formatKm, monthlyEMI } from "@/lib/utils";
import type { MockListing } from "@/lib/mock-data";

type Row = {
  label: string;
  get: (l: MockListing) => string | number;
  best?: "min" | "max";
  raw?: (l: MockListing) => number;
};

export function CompareView({ locale = "en" }: { locale?: "en" | "ar" }) {
  const { ids, toggle, clear } = useCompare();
  const [items, setItems] = useState<MockListing[] | null>(null);

  useEffect(() => {
    if (ids.length === 0) {
      setItems([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/listings?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setItems(d.items ?? []))
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (items !== null && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 rounded-xl bg-white border border-[#E5E5E5] shadow-card">
        <GitCompare className="h-8 w-8 text-muted mb-3" />
        <h3 className="text-sm font-semibold">Nothing to compare yet</h3>
        <p className="mt-1 text-xs text-muted max-w-xs">
          Add up to 3 cars using the compare icon on any listing.
        </p>
        <Link href="/buy" className="mt-4 text-xs text-[#A98F2E] hover:underline">
          Browse inventory →
        </Link>
      </div>
    );
  }

  if (items === null) {
    return <div className="text-xs text-muted py-12 text-center">Loading…</div>;
  }

  const rows: Row[] = [
    { label: "Price", get: (l) => formatAED(l.priceAED, locale), best: "min", raw: (l) => l.priceAED },
    { label: "Est. monthly", get: (l) => `${formatAED(monthlyEMI(l.priceAED), locale)}/mo`, best: "min", raw: (l) => monthlyEMI(l.priceAED) },
    { label: "Year", get: (l) => l.year, best: "max", raw: (l) => l.year },
    { label: "Mileage", get: (l) => formatKm(l.kms, locale), best: "min", raw: (l) => l.kms },
    { label: "Body type", get: (l) => l.bodyType },
    { label: "Fuel", get: (l) => l.fuel },
    { label: "Transmission", get: (l) => l.transmission },
    { label: "Regional spec", get: (l) => l.regionalSpec },
    { label: "Exterior colour", get: (l) => l.exteriorColor },
    { label: "Emirate", get: (l) => l.emirate },
    { label: "Export ready", get: (l) => (l.isExportReady ? "Yes" : "—") },
    { label: "Inspected", get: (l) => (l.isInspected ? "Yes" : "—") },
    { label: "Dealer", get: (l) => l.dealer.name },
  ];

  const bestIndex = (row: Row): number | null => {
    if (!row.best || !row.raw || items.length < 2) return null;
    const vals = items.map(row.raw);
    const target = row.best === "min" ? Math.min(...vals) : Math.max(...vals);
    return vals.indexOf(target);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-secondary">
          Comparing <span className="text-[#1A1A1A] font-semibold">{items.length}</span> cars
        </p>
        <button
          onClick={clear}
          className="text-[10px] text-muted hover:text-[#1A1A1A]"
        >
          Clear all
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E5E5E5]">
        <table className="w-full text-xs border-collapse min-w-[640px]">
          <thead>
            <tr>
              <th className="w-32 bg-white sticky left-0" />
              {items.map((l) => (
                <th key={l.id} className="p-3 bg-white border-l border-[#E5E5E5] align-top text-left font-normal">
                  <div className="relative aspect-[4/3] rounded-sm overflow-hidden bg-[#F4F4F4] mb-2">
                    <Image src={l.imageUrl} alt={l.model} fill sizes="200px" className="object-cover" />
                    <button
                      onClick={() => toggle(l.id)}
                      aria-label="Remove"
                      className="absolute top-1 right-1 h-6 w-6 rounded-sm bg-white/90 border border-[#E5E5E5] text-[#1A1A1A] grid place-items-center hover:bg-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <Link
                    href={`/listings/${l.id}/${l.slug}`}
                    className="block font-semibold text-[#1A1A1A] hover:text-[#A98F2E] leading-snug"
                  >
                    {l.year} {l.make} {l.model}
                  </Link>
                  {l.trim && <div className="text-[10px] text-muted mt-0.5">{l.trim}</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const winner = bestIndex(row);
              return (
                <tr key={row.label} className="border-t border-[#E5E5E5]">
                  <td className="p-3 bg-white sticky left-0 text-muted text-[10px] uppercase tracking-wider">
                    {row.label}
                  </td>
                  {items.map((l, i) => (
                    <td
                      key={l.id}
                      className={`p-3 border-l border-[#E5E5E5] ${
                        winner === i ? "text-[#A98F2E] font-semibold" : "text-secondary"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {row.get(l)}
                        {winner === i && <Trophy className="h-3 w-3" />}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
