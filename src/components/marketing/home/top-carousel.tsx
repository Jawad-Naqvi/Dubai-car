"use client";

import { useRef } from "react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";

export interface TopCar {
  id: string;
  slug: string;
  name: string;
  priceLabel: string;
  rating: number;
  image: string;
  tint: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-secondary">
      <Star className="h-3 w-3 fill-[#F0941F] text-[#F0941F]" />
      ({rating.toFixed(1)})
    </span>
  );
}

/* Horizontal product-style carousel — Meher "Top-Selling" section. */
export function TopCarousel({ cars }: { cars: TopCar[] }) {
  const track = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    track.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={() => scroll(-1)}
          aria-label="Previous"
          className="h-9 w-9 rounded-full border border-[#141414]/15 flex items-center justify-center text-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 rtl-flip" />
        </button>
        <button
          onClick={() => scroll(1)}
          aria-label="Next"
          className="h-9 w-9 rounded-full border border-[#141414]/15 flex items-center justify-center text-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
        >
          <ArrowRight className="h-4 w-4 rtl-flip" />
        </button>
      </div>

      <div
        ref={track}
        className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2"
      >
        {cars.map((car, i) => (
          <Link
            key={car.id}
            href={`/listings/${car.id}/${car.slug}`}
            className="group snap-start flex-shrink-0 w-56 sm:w-64"
          >
            <div
              className={`relative aspect-square rounded-3xl overflow-hidden ${car.tint} ${
                i % 2 === 1 ? "sm:-translate-y-0 sm:scale-[1.02]" : ""
              }`}
            >
              <Image
                src={car.image}
                alt={car.name}
                fill
                sizes="256px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="mt-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-[#141414] truncate">
                  {car.name}
                </div>
                <div className="mt-0.5">
                  <Stars rating={car.rating} />
                </div>
              </div>
              <div className="text-[13px] font-bold text-[#141414] whitespace-nowrap">
                {car.priceLabel}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
