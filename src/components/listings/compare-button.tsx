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
          "flex items-center justify-center gap-1.5 h-9 rounded-full border text-xs font-semibold transition-colors",
          active
            ? "border-[#8136B2]/50 bg-[#8136B2]/10 text-[#6B21A8]"
            : "border-[#141414]/20 text-[#141414] hover:bg-[#F4F4F6]",
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
        "h-7 w-7 rounded-full bg-white/90 backdrop-blur border flex items-center justify-center transition-colors",
        active
          ? "border-[#8136B2]/50 text-[#8136B2]"
          : "border-[#E5E5EA] text-[#141414] hover:bg-white",
        className,
      )}
    >
      <GitCompare className="h-3.5 w-3.5" />
    </button>
  );
}
