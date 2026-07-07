"use client";

import { Heart } from "lucide-react";
import { useSavedListings } from "@/lib/saved-listings";
import { cn } from "@/lib/utils";

export function SaveButton({
  listingId,
  className,
  variant = "icon",
}: {
  listingId: string;
  className?: string;
  variant?: "icon" | "full";
}) {
  const { isSaved, toggle } = useSavedListings();
  const saved = isSaved(listingId);

  if (variant === "full") {
    return (
      <button
        onClick={() => toggle(listingId)}
        suppressHydrationWarning
        className={cn(
          "flex items-center justify-center gap-1.5 h-9 rounded-sm border text-xs font-semibold transition-colors",
          saved
            ? "border-[#C8A93E]/50 bg-[#C8A93E]/10 text-[#A98F2E]"
            : "border-[#E5E5E5] text-secondary hover:border-[#C8A93E]/40 hover:text-[#1A1A1A]",
          className,
        )}
      >
        <Heart className={cn("h-3.5 w-3.5", saved && "fill-[#C8A93E]")} />
        {saved ? "Saved" : "Save"}
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
      aria-label={saved ? "Remove from saved" : "Save"}
      suppressHydrationWarning
      className={cn(
        "h-8 w-8 rounded-lg bg-white/90 backdrop-blur border flex items-center justify-center transition-colors",
        saved
          ? "border-[#C8A93E]/50 text-[#C8A93E]"
          : "border-[#E5E5E5] text-[#1A1A1A] hover:border-[#C8A93E]/40",
        className,
      )}
    >
      <Heart className={cn("h-3.5 w-3.5", saved && "fill-[#C8A93E]")} />
    </button>
  );
}
