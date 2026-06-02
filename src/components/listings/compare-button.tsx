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
            ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#F0CE5C]"
            : "border-white/10 text-secondary hover:border-[#D4AF37]/40 hover:text-white",
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
        "h-7 w-7 rounded-sm bg-[#0A0A0A]/80 backdrop-blur border flex items-center justify-center transition-colors",
        active
          ? "border-[#D4AF37]/50 text-[#F0CE5C]"
          : "border-white/10 text-white hover:border-[#D4AF37]/40",
        className,
      )}
    >
      <GitCompare className="h-3.5 w-3.5" />
    </button>
  );
}
