"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { BellPlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Params that describe a search (excludes pagination/sort noise). */
const SEARCH_KEYS = new Set([
  "q", "make", "model", "trim", "bodyType", "fuel", "transmission",
  "drivetrain", "dealRating", "regionalSpec", "emirate", "condition",
  "color", "interiorColor", "cylinders", "doors", "sellerType",
  "priceMin", "priceMax", "yearMin", "yearMax", "kmsMax",
  "exportReady", "inspected", "withPhotos",
]);

/**
 * "Save search" — persists the current Buy-page filters as a saved search so
 * the buyer gets emailed when new matching cars are listed. Signed-out users
 * are routed to sign-up first (their search is preserved in the redirect).
 */
export function SaveSearchButton({ className }: { className?: string }) {
  const params = useSearchParams();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const [saving, setSaving] = useState(false);

  const collectQuery = (): Record<string, string> => {
    const q: Record<string, string> = {};
    for (const key of SEARCH_KEYS) {
      const values = params.getAll(key);
      if (values.length) q[key] = values.join(",");
    }
    return q;
  };

  const nameFor = (q: Record<string, string>): string => {
    const bits = [q.make, q.model, q.bodyType, q.q].filter(Boolean);
    if (q.priceMax) bits.push(`under ${Number(q.priceMax).toLocaleString()}`);
    return bits.join(" ") || "All cars";
  };

  const save = async () => {
    const query = collectQuery();
    if (!isSignedIn) {
      // redirect_url is handed to Clerk, which does a plain browser redirect —
      // it doesn't know about next-intl locale routing, so it must be prefixed
      // explicitly (unlike a real Link/router.push target).
      const back = `/${locale}/buy${params.toString() ? `?${params.toString()}` : ""}`;
      router.push(`/sign-up?redirect_url=${encodeURIComponent(back)}`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameFor(query), query, frequency: "daily" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Search saved", {
        description: "We'll email you when new matching cars are listed.",
      });
    } catch {
      toast.error("Could not save search. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={save}
      disabled={saving}
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-3 rounded-full border border-[#141414]/20 text-[11px] font-semibold text-[#141414] hover:bg-[#141414] hover:text-white transition-colors disabled:opacity-60",
        className,
      )}
    >
      {saving ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <BellPlus className="h-3 w-3" />
      )}
      Save search
    </button>
  );
}
