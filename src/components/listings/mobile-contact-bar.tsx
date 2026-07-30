"use client";

import { formatAED } from "@/lib/utils";

/**
 * cars.com-style mobile sticky bottom bar on the vehicle detail page: price on
 * the left, a primary "Check availability" CTA that scrolls to the contact
 * panel. Hidden on lg+ (the desktop right rail handles it there).
 */
export function MobileContactBar({
  priceAED,
  locale = "en",
}: {
  priceAED: number;
  locale?: "en" | "ar";
}) {
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E5E5EA] shadow-[0_-4px_16px_-6px_rgba(0,0,0,0.12)] px-4 py-2.5 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[10px] text-muted leading-none">Price</div>
        <div className="text-base font-bold text-[#141414] leading-tight">
          {formatAED(priceAED, locale)}
        </div>
      </div>
      <a
        href="#contact"
        className="flex items-center justify-center h-10 px-5 rounded-md bg-[#8136B2] text-white text-sm font-semibold hover:bg-[#370B55] transition-colors"
      >
        Check availability
      </a>
    </div>
  );
}
