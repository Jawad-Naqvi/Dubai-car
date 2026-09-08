"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Loader2, Check, Clock, Ship, AlertCircle } from "lucide-react";

/**
 * The buyer comparing bids on one shipping request.
 *
 * Awarding is deliberate and one-way: accepting a quote closes the request,
 * rejects every sibling bid, creates the shipment, and adds the winning
 * forwarder as a participant. Until that moment no forwarder can see who the
 * buyer is.
 */

interface QuoteRow {
  id: string;
  forwarderName: string;
  status: string;
  currency: string;
  totalMinor: number | null;
  transitDays: number | null;
  validUntil: string | null;
  notes: string | null;
}

export function QuoteComparison({
  requestReference,
  lane,
  quotes,
  awarded,
}: {
  requestReference: string;
  lane: string;
  quotes: QuoteRow[];
  awarded: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const cheapest = quotes
    .filter((q) => q.totalMinor != null)
    .sort((a, b) => (a.totalMinor ?? 0) - (b.totalMinor ?? 0))[0];
  const fastest = quotes
    .filter((q) => q.transitDays != null)
    .sort((a, b) => (a.transitDays ?? 0) - (b.transitDays ?? 0))[0];

  const award = async (quoteId: string) => {
    setBusyId(quoteId);
    try {
      const res = await fetch(`/api/freight/quotes/${quoteId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Booked. Your shipment is now being tracked.");
      router.push(`/dashboard/shipments/${data.shipmentId}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not book.");
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-xl border border-[#E5E5EA] bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[#E5E5EA] px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-[#141414]">{requestReference}</h3>
          <p className="text-[11px] text-muted">{lane}</p>
        </div>
        <span className="text-[10px] text-muted flex-shrink-0 tabular-nums">
          {quotes.length} quote{quotes.length === 1 ? "" : "s"}
        </span>
      </div>

      {quotes.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Clock className="h-5 w-5 text-muted mx-auto mb-2" />
          <p className="text-[11px] text-muted leading-relaxed">
            Waiting for freight partners to quote. This usually takes a few
            hours — we&apos;ll email you.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#E5E5EA]">
          {quotes.map((q) => {
            const expired =
              q.validUntil && new Date(q.validUntil).getTime() < Date.now();
            const won = q.status === "accepted";

            return (
              <li key={q.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-semibold text-[#141414]">
                        {q.forwarderName}
                      </h4>
                      {won && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#137A43]/12 px-2 py-0.5 text-[10px] font-semibold text-[#137A43]">
                          <Check className="h-2.5 w-2.5" /> Booked
                        </span>
                      )}
                      {q.id === cheapest?.id && !won && (
                        <span className="rounded-full bg-[#137A43]/12 px-2 py-0.5 text-[10px] font-semibold text-[#137A43]">
                          Best price
                        </span>
                      )}
                      {q.id === fastest?.id && q.id !== cheapest?.id && !won && (
                        <span className="rounded-full bg-[#1B4FA0]/10 px-2 py-0.5 text-[10px] font-semibold text-[#1B4FA0]">
                          Fastest
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-bold text-[#141414] tabular-nums">
                        {q.totalMinor != null
                          ? `${q.currency} ${(q.totalMinor / 100).toLocaleString()}`
                          : "—"}
                      </span>
                      {q.transitDays != null && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-secondary">
                          <Ship className="h-3 w-3" />~{q.transitDays} days
                        </span>
                      )}
                    </div>

                    {q.notes && (
                      <p className="mt-1 text-[11px] text-secondary leading-relaxed">
                        {q.notes}
                      </p>
                    )}

                    {q.validUntil && (
                      <p
                        className={`mt-1 inline-flex items-center gap-1 text-[10px] ${
                          expired ? "text-[#DC2626]" : "text-muted"
                        }`}
                      >
                        {expired ? (
                          <AlertCircle className="h-2.5 w-2.5" />
                        ) : (
                          <Clock className="h-2.5 w-2.5" />
                        )}
                        {expired ? "Expired" : "Valid until"}{" "}
                        {new Date(q.validUntil).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    )}
                  </div>

                  {!awarded && !expired && (
                    <button
                      type="button"
                      onClick={() => award(q.id)}
                      disabled={busyId !== null}
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-[#8136B2] text-white text-[11px] font-semibold hover:bg-[#370B55] transition-colors flex-shrink-0 disabled:opacity-50"
                    >
                      {busyId === q.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Book this"
                      )}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
