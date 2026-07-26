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
          "flex items-center justify-center gap-1.5 h-9 rounded-full border text-xs font-semibold transition-colors",
          saved
            ? "border-[#8136B2]/50 bg-[#8136B2]/10 text-[#6B21A8]"
            : "border-[#141414]/20 text-[#141414] hover:bg-[#F4F4F6]",
          className,
        )}
      >
        <Heart className={cn("h-3.5 w-3.5", saved && "fill-[#8136B2]")} />
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
        "h-8 w-8 rounded-full bg-white/90 backdrop-blur border flex items-center justify-center transition-colors",
        saved
          ? "border-[#8136B2]/50 text-[#8136B2]"
          : "border-[#E5E5EA] text-[#141414] hover:bg-white",
        className,
      )}
    >
      <Heart className={cn("h-3.5 w-3.5", saved && "fill-[#8136B2]")} />
    </button>
  );
}
