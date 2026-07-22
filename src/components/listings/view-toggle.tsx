"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

/** Grid ⇆ list toggle for the results page, persisted in the URL (?view=). */
export function ViewToggle({ view }: { view: "grid" | "list" }) {
  const pathname = usePathname();
  const sp = useSearchParams();

  const hrefFor = (v: string) => {
    const p = new URLSearchParams(sp.toString());
    p.set("view", v);
    p.delete("page");
    return `${pathname}?${p.toString()}`;
  };

  const base =
    "inline-flex h-8 w-9 items-center justify-center transition-colors";
  const on = "bg-[#8136B2] text-white";
  const off = "bg-white text-[#63666A] hover:text-[#141414]";

  return (
    <div className="inline-flex rounded-md border border-[#E5E5EA] overflow-hidden">
      <Link href={hrefFor("list")} aria-label="List view" className={cn(base, view === "list" ? on : off)}>
        <List className="h-4 w-4" />
      </Link>
      <Link href={hrefFor("grid")} aria-label="Grid view" className={cn(base, "border-l border-[#E5E5EA]", view === "grid" ? on : off)}>
        <LayoutGrid className="h-4 w-4" />
      </Link>
    </div>
  );
}
