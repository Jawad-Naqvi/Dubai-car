"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Heart } from "lucide-react";
import { ListingCard } from "./listing-card";
import { ListingCardSkeleton } from "./listing-card";
import { useSavedListings } from "@/lib/saved-listings";
import type { MockListing } from "@/lib/mock-data";

export function SavedView({ locale = "en" }: { locale?: "en" | "ar" }) {
  const { ids } = useSavedListings();
  const [items, setItems] = useState<MockListing[] | null>(null);

  useEffect(() => {
    if (ids.length === 0) {
      setItems([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/listings?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setItems(d.items ?? []);
      })
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (items === null) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 rounded-3xl bg-white border border-[#E7E4DA] shadow-card">
        <Heart className="h-8 w-8 text-muted mb-3" />
        <h3 className="text-sm font-semibold">No saved cars yet</h3>
        <p className="mt-1 text-xs text-muted max-w-xs">
          Tap the heart on any listing to save it here for later.
        </p>
        <Link href="/buy" className="mt-4 text-xs font-semibold text-[#141414] underline underline-offset-2 hover:opacity-70">
          Browse inventory →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {items.map((l) => (
        <ListingCard key={l.id} listing={l} locale={locale} />
      ))}
    </div>
  );
}
