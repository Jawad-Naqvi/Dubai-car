"use client";

import { useQueryState } from "@/lib/use-query-state";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const { push } = useQueryState();
  if (totalPages <= 1) return null;

  const go = (p: number) => push({ page: p === 1 ? null : String(p) });

  // windowed page numbers around the current page
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="mt-8 flex items-center justify-center gap-1.5">
      <button
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="h-8 px-3 rounded-sm border border-white/10 text-xs text-secondary hover:border-[#D4AF37]/30 disabled:opacity-40 disabled:pointer-events-none"
      >
        Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => go(p)}
          className={cn(
            "h-8 w-8 rounded-sm text-xs",
            p === page
              ? "bg-[#F0CE5C] text-[#1A1208] font-semibold"
              : "border border-white/10 text-secondary hover:border-[#D4AF37]/30",
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className="h-8 px-3 rounded-sm border border-white/10 text-xs text-secondary hover:border-[#D4AF37]/30 disabled:opacity-40 disabled:pointer-events-none"
      >
        Next
      </button>
    </div>
  );
}
