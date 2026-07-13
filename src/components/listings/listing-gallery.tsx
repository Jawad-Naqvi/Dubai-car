"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { SaveButton } from "./save-button";
import { CompareButton } from "./compare-button";

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
  const [active, setActive] = useState(0);
  const safe = images.length ? images : [""];
  const current = safe[Math.min(active, safe.length - 1)];

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

  const go = (dir: 1 | -1) =>
    setActive((i) => (i + dir + safe.length) % safe.length);

  return (
    <div>
      <div className="relative rounded-3xl overflow-hidden bg-[#F3F1E9] border border-[#E7E4DA] shadow-card aspect-[16/10] group">
        {current ? (
          <Image
            src={current}
            alt={title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted text-xs">
            No image
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          {badges.featured && <Badge tone="featured">Featured</Badge>}
          {badges.exportReady && <Badge tone="export">Export Ready</Badge>}
          {badges.inspected && (
            <Badge tone="inspected">
              <BadgeCheck className="h-2 w-2 mr-0.5" /> Inspected
            </Badge>
          )}
          {badges.reserved && <Badge tone="reserved">Reserved</Badge>}
        </div>

        <div className="absolute top-3 right-3 flex gap-1.5">
          <SaveButton listingId={listingId} />
          <CompareButton listingId={listingId} className="h-8 w-8" />
          <button
            onClick={share}
            aria-label="Share"
            className="h-8 w-8 rounded-full bg-white/90 backdrop-blur border border-[#E7E4DA] text-[#141414] flex items-center justify-center hover:bg-white transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {safe.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 backdrop-blur border border-[#E7E4DA] text-[#141414] flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 backdrop-blur border border-[#E7E4DA] text-[#141414] flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-white/90 border border-[#E7E4DA] text-[#141414]">
              {active + 1} / {safe.length}
            </div>
          </>
        )}
      </div>

      {safe.length > 1 && (
        <div className="mt-2.5 grid grid-cols-5 gap-2">
          {safe.slice(0, 10).map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative aspect-[4/3] rounded-xl overflow-hidden bg-[#F3F1E9] border ${
                i === active ? "border-[#141414]" : "border-[#E7E4DA]"
              } hover:border-[#141414]/40 transition-colors`}
            >
              {src && (
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover opacity-80 hover:opacity-100"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
