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
            ? "border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#F0CE5C]"
            : "border-white/10 text-secondary hover:border-[#D4AF37]/40 hover:text-white",
          className,
        )}
      >
        <Heart className={cn("h-3.5 w-3.5", saved && "fill-[#F0CE5C]")} />
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
        "h-8 w-8 rounded-sm bg-[#0A0A0A]/80 backdrop-blur border flex items-center justify-center transition-colors",
        saved
          ? "border-[#D4AF37]/50 text-[#F0CE5C]"
          : "border-white/10 text-white hover:border-[#D4AF37]/40",
        className,
      )}
    >
      <Heart className={cn("h-3.5 w-3.5", saved && "fill-[#F0CE5C]")} />
    </button>
  );
}
