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
        className="h-8 px-3.5 rounded-full border border-[#141414]/20 text-xs font-semibold text-[#141414] hover:bg-[#141414] hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => go(p)}
          className={cn(
            "h-8 w-8 rounded-full text-xs transition-colors",
            p === page
              ? "bg-[#141414] text-white font-semibold"
              : "border border-[#141414]/20 text-[#141414] hover:bg-[#141414] hover:text-white",
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className="h-8 px-3.5 rounded-full border border-[#141414]/20 text-xs font-semibold text-[#141414] hover:bg-[#141414] hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        Next
      </button>
    </div>
  );
}
