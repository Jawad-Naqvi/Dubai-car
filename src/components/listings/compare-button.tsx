"use client";

import { GitCompare } from "lucide-react";
import { useCompare } from "@/lib/compare";
import { cn } from "@/lib/utils";

export function CompareButton({
  listingId,
  className,
  variant = "icon",
}: {
  listingId: string;
  className?: string;
  variant?: "icon" | "full";
}) {
  const { isComparing, toggle } = useCompare();
  const active = isComparing(listingId);

  if (variant === "full") {
    return (
      <button
        onClick={() => toggle(listingId)}
        suppressHydrationWarning
        className={cn(
          "flex items-center justify-center gap-1.5 h-9 rounded-sm border text-xs font-semibold transition-colors",
          active
            ? "border-[#C8A93E]/50 bg-[#C8A93E]/10 text-[#A98F2E]"
            : "border-[#E5E5E5] text-secondary hover:border-[#C8A93E]/40 hover:text-[#1A1A1A]",
          className,
        )}
      >
        <GitCompare className="h-3.5 w-3.5" />
        {active ? "Comparing" : "Compare"}
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(listingId);
      }}
      aria-label={active ? "Remove from compare" : "Add to compare"}
      title="Compare"
      suppressHydrationWarning
      className={cn(
        "h-7 w-7 rounded-lg bg-white/90 backdrop-blur border flex items-center justify-center transition-colors",
        active
          ? "border-[#C8A93E]/50 text-[#C8A93E]"
          : "border-[#E5E5E5] text-[#1A1A1A] hover:border-[#C8A93E]/40",
        className,
      )}
    >
      <GitCompare className="h-3.5 w-3.5" />
    </button>
  );
}
