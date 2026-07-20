"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ArrowUpRight } from "lucide-react";
import { useSavedListings } from "@/lib/saved-listings";

/* Hero promo tile — image card with a working save-heart, CTA pill, and
   white label chip (Meher reference: the three cards under the headline). */
export function PromoCard({
  image,
  label,
  cta,
  href,
  alt,
  listingId,
  delay = 0,
}: {
  image: string;
  label: string;
  cta: string;
  href: string;
  alt: string;
  /** underlying listing powering this promo — heart toggles it in Saved */
  listingId?: string;
  delay?: number;
}) {
  const { toggle, isSaved } = useSavedListings();
  const saved = listingId ? isSaved(listingId) : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative h-64 sm:h-72 lg:h-80 rounded-3xl overflow-hidden bg-[#F3F1E9]"
    >
      <Image
        src={image}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Heart — toggles the underlying listing in Saved */}
      {listingId && (
        <button
          aria-label={saved ? "Remove from saved" : "Save"}
          aria-pressed={saved}
          onClick={() => toggle(listingId)}
          className={`absolute top-3 left-3 h-9 w-9 rounded-full flex items-center justify-center shadow-card transition-colors ${
            saved
              ? "bg-[#141414] text-white"
              : "bg-white/95 text-[#141414] hover:bg-[#141414] hover:text-white"
          }`}
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
        </button>
      )}

      {/* CTA pill */}
      <Link
        href={href}
        className="absolute top-3 right-3 inline-flex items-center gap-1 h-9 px-4 rounded-full bg-[#141414] text-white text-xs font-semibold hover:bg-[#F0941F] transition-colors"
      >
        {cta}
      </Link>

      {/* Label chip */}
      <Link
        href={href}
        className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-[85%] flex items-center justify-between gap-3 rounded-2xl bg-white/95 backdrop-blur px-4 py-3 shadow-card group/label"
      >
        <span className="text-[13px] font-semibold text-[#141414] leading-snug">
          {label}
        </span>
        <span className="h-7 w-7 flex-shrink-0 rounded-full border border-[#141414]/15 flex items-center justify-center group-hover/label:bg-[#141414] group-hover/label:text-white transition-colors">
          <ArrowUpRight className="h-3.5 w-3.5 rtl-flip" />
        </span>
      </Link>
    </motion.div>
  );
}
