"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal, X } from "lucide-react";
import { FilterSidebar, type Facets } from "./filter-sidebar";
import { useActiveFilterCount } from "./active-filters";

/**
 * Below `lg` the sidebar is hidden, so filters live behind a sticky button that
 * opens a full-height drawer. The drawer reuses FilterSidebar verbatim and
 * closes itself once Apply/Reset commits to the URL.
 */
export function MobileFilterBar({
  facets,
  total,
}: {
  facets?: Facets;
  total?: number;
}) {
  const t = useTranslations("filters");
  const [open, setOpen] = useState(false);
  const count = useActiveFilterCount();

  // Lock the page behind the drawer so only the drawer scrolls.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-10 px-4 rounded-full bg-[#141414] text-white text-xs font-semibold shadow-card hover:opacity-90 transition-opacity"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        {t("title")}
        {count > 0 && (
          <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[#8136B2] text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
            className="relative ms-auto flex h-full w-full max-w-sm flex-col bg-[#F7F5EF] shadow-xl animate-in slide-in-from-right duration-200"
          >
            <div className="flex items-center justify-between px-4 h-14 border-b border-[#E5E5EA] bg-white">
              <span className="text-sm font-semibold text-[#141414]">
                {t("title")}
                {total !== undefined && (
                  <span className="ms-1.5 text-[11px] font-normal text-muted">
                    · {total.toLocaleString()} {t("results")}
                  </span>
                )}
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close filters"
                className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-[#F4F4F6]"
              >
                <X className="h-4 w-4 text-[#141414]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <FilterSidebar
                facets={facets}
                total={total}
                onApplied={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
