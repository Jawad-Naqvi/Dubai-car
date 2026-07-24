"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  BadgeCheck,
  Share2,
  ChevronLeft,
  ChevronRight,
  Images,
  X,
} from "lucide-react";
import { SaveButton } from "./save-button";
import { CompareButton } from "./compare-button";
import { cn } from "@/lib/utils";

/**
 * cars.com-style VDP gallery: mosaic hero (one large tile + 2×2 grid) with a
 * "See gallery (N)" button; every tile opens a full-screen viewer. On small
 * screens the mosaic collapses to a single swipeable hero image.
 */
export function ListingGallery({
  images,
  title,
  listingId,
  badges,
}: {
  images: string[];
  title: string;
  listingId: string;
  badges: {
    featured?: boolean;
    exportReady?: boolean;
    inspected?: boolean;
    reserved?: boolean;
  };
}) {
  const safe = images.filter(Boolean);
  const list = safe.length ? safe : [""];
  const [viewer, setViewer] = useState<number | null>(null);
  const [active, setActive] = useState(0); // mobile hero index

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* user cancelled */
    }
  };

  const open = (i: number) => list[0] && setViewer(i);
  const step = useCallback(
    (dir: 1 | -1) =>
      setViewer((v) => (v === null ? v : (v + dir + list.length) % list.length)),
    [list.length],
  );

  // Keyboard controls for the overlay viewer.
  useEffect(() => {
    if (viewer === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer, step]);

  const tiles = list.slice(1, 5);

  const badgeRow = (
    <div className="absolute top-3 left-3 flex flex-wrap gap-1 z-10">
      {badges.featured && <Badge tone="featured">Featured</Badge>}
      {badges.exportReady && <Badge tone="export">Export Ready</Badge>}
      {badges.inspected && (
        <Badge tone="inspected">
          <BadgeCheck className="h-2 w-2 mr-0.5" /> Inspected
        </Badge>
      )}
      {badges.reserved && <Badge tone="reserved">Reserved</Badge>}
    </div>
  );

  const actionRow = (
    <div className="absolute top-3 right-3 flex gap-1.5 z-10">
      <SaveButton listingId={listingId} />
      <CompareButton listingId={listingId} className="h-8 w-8" />
      <button
        onClick={share}
        aria-label="Share"
        className="h-8 w-8 rounded-full bg-white/90 backdrop-blur border border-[#E5E5EA] text-[#141414] flex items-center justify-center hover:bg-white transition-colors"
      >
        <Share2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  const seeGallery = list.length > 1 && (
    <button
      onClick={() => open(0)}
      className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/95 border border-[#E5E5EA] text-xs font-semibold text-[#141414] hover:bg-white transition-colors"
    >
      <Images className="h-3.5 w-3.5" />
      See gallery ({list.length})
    </button>
  );

  return (
    <div>
      {/* -------- Mobile: single hero with prev/next -------- */}
      <div className="relative sm:hidden rounded-lg overflow-hidden bg-[#F4F4F6] border border-[#E5E5EA] h-[240px] group">
        {badgeRow}
        {actionRow}
        {list[active] ? (
          <button onClick={() => open(active)} className="absolute inset-0">
            <Image
              src={list[active]}
              alt={title}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </button>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted text-xs">
            No image
          </div>
        )}
        {list.length > 1 && (
          <>
            <button
              onClick={() => setActive((i) => (i - 1 + list.length) % list.length)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 border border-[#E5E5EA] text-[#141414] flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActive((i) => (i + 1) % list.length)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 border border-[#E5E5EA] text-[#141414] flex items-center justify-center"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-white/90 border border-[#E5E5EA] text-[#141414]">
              {active + 1} / {list.length}
            </div>
          </>
        )}
        {seeGallery}
      </div>

      {/* -------- Desktop: mosaic (1 large + up to 4 tiles) -------- */}
      <div
        className={cn(
          "relative hidden sm:grid gap-2 h-[340px] lg:h-[420px]",
          tiles.length >= 4
            ? "grid-cols-4 grid-rows-2"
            : tiles.length >= 2
              ? "grid-cols-3 grid-rows-2"
              : "grid-cols-1",
        )}
      >
        {badgeRow}
        {actionRow}
        {seeGallery}

        <button
          onClick={() => open(0)}
          className={cn(
            "relative rounded-l-lg overflow-hidden bg-[#F4F4F6] border border-[#E5E5EA]",
            tiles.length >= 2 ? "col-span-2 row-span-2" : "rounded-lg",
          )}
        >
          {list[0] ? (
            <Image
              src={list[0]}
              alt={title}
              fill
              priority
              sizes="(max-width: 1024px) 66vw, 640px"
              className="object-cover hover:opacity-95 transition-opacity"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted text-xs">
              No image
            </div>
          )}
        </button>

        {tiles.map((src, i) => (
          <button
            key={i}
            onClick={() => open(i + 1)}
            className={cn(
              "relative overflow-hidden bg-[#F4F4F6] border border-[#E5E5EA]",
              // round the outer corners of the mosaic's right edge
              i === tiles.length - 2 && tiles.length >= 4 && "rounded-tr-lg",
              i === 1 && tiles.length < 4 && "rounded-tr-lg",
              i === tiles.length - 1 && "rounded-br-lg",
            )}
          >
            <Image
              src={src}
              alt={`${title} photo ${i + 2}`}
              fill
              sizes="320px"
              className="object-cover hover:opacity-95 transition-opacity"
            />
          </button>
        ))}
      </div>

      {/* -------- Full-screen viewer -------- */}
      {viewer !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          role="dialog"
          aria-label={`${title} gallery`}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-xs font-medium">
              {viewer + 1} / {list.length} · {title}
            </span>
            <button
              onClick={() => setViewer(null)}
              aria-label="Close gallery"
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="relative flex-1 mx-4 mb-4">
            {list[viewer] && (
              <Image
                src={list[viewer]}
                alt={`${title} photo ${viewer + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
              />
            )}
            {list.length > 1 && (
              <>
                <button
                  onClick={() => step(-1)}
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => step(1)}
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
