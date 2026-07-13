"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";

export interface Testimonial {
  name: string;
  date: string;
  title: string;
  body: string;
}

function StarRow() {
  return (
    <span className="inline-flex gap-0.5">
      {[0, 1, 2, 3].map((i) => (
        <Star key={i} className="h-3 w-3 fill-[#F0941F] text-[#F0941F]" />
      ))}
      <Star className="h-3 w-3 text-[#E7E4DA] fill-[#E7E4DA]" />
    </span>
  );
}

function Card({ item }: { item: Testimonial }) {
  return (
    <div className="rounded-3xl bg-white shadow-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative h-9 w-9 rounded-full overflow-hidden bg-[#F3F1E9] flex-shrink-0">
            <Image
              src={`https://api.dicebear.com/9.x/notionists/png?seed=${encodeURIComponent(item.name)}&backgroundColor=fbe7d4,cfe3f3,dfede0`}
              alt={item.name}
              fill
              sizes="36px"
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#141414] truncate">{item.name}</div>
            <div className="text-[10px] text-muted">{item.date}</div>
          </div>
        </div>
        <StarRow />
      </div>
      <h4 className="mt-4 text-sm font-bold text-[#141414]">{item.title}</h4>
      <p className="mt-2 text-xs text-secondary leading-relaxed">{item.body}</p>
    </div>
  );
}

/* Paged two-up testimonial carousel — Meher "Our happy clients". */
export function Testimonials({ items }: { items: Testimonial[] }) {
  const pages: Testimonial[][] = [];
  for (let i = 0; i < items.length; i += 2) pages.push(items.slice(i, i + 2));
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);

  const go = (d: 1 | -1) => {
    setDir(d);
    setPage((p) => (p + d + pages.length) % pages.length);
  };

  return (
    <div className="relative">
      <button
        onClick={() => go(-1)}
        aria-label="Previous testimonials"
        className="absolute -left-2 lg:-left-14 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-card flex items-center justify-center text-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Next testimonials"
        className="absolute -right-2 lg:-right-14 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white shadow-card flex items-center justify-center text-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
      >
        <ArrowRight className="h-4 w-4 rtl-flip" />
      </button>

      <div className="overflow-hidden rounded-3xl bg-[#F3F1E9] p-3 sm:p-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page}
            initial={{ opacity: 0, x: dir * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -60 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
          >
            {pages[page].map((item) => (
              <Card key={item.name} item={item} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex justify-center gap-1.5">
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDir(i > page ? 1 : -1);
              setPage(i);
            }}
            aria-label={`Page ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === page ? "w-6 bg-[#141414]" : "w-1.5 bg-[#141414]/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
