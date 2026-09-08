"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Loader2, Send, Package, Clock, CheckCircle2, XCircle } from "lucide-react";

/**
 * The forwarder's bid board.
 *
 * Note what a forwarder can see here: the lane, the vehicle, the terms and the
 * dates. Not the buyer's name, email or address. Customer identity is withheld
 * until a bid is actually awarded, so forwarders who lose the job learn
 * nothing about the customer they bid on.
 */

interface BidRow {
  quoteId: string;
  status: string;
  totalMinor: number | null;
  currency: string;
  validUntil: string | null;
  request: {
    id: string;
    reference: string;
    originCountry: string;
    originCity: string | null;
    destCountry: string;
    destCity: string | null;
    destPort: string | null;
    mode: string;
    incoterm: string;
    vehicleCount: number;
    vehicleSummary: unknown;
    notes: string | null;
    status: string;
    createdAt: string;
  };
}

export function BidBoard({ bids }: { bids: BidRow[] }) {
  if (bids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 rounded-xl border border-[#E5E5EA] bg-white">
        <Package className="h-7 w-7 text-muted mb-3" />
        <h3 className="text-sm font-semibold text-[#141414]">
          No requests yet
        </h3>
        <p className="mt-1 text-xs text-muted max-w-sm leading-relaxed">
          Shipping requests matching the lanes you serve will appear here. Add
          more lanes to see more work.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bids.map((bid) => (
        <BidCard key={bid.quoteId} bid={bid} />
      ))}
    </div>
  );
}

function BidCard({ bid }: { bid: BidRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState("");
  const [transitDays, setTransitDays] = useState("");
  const [validUntil, setValidUntil] = useState(() =>
    new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const decided = bid.status === "accepted" || bid.status === "rejected";

  const submit = async () => {
    const amount = Number(total);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid total.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/freight/quotes/${bid.quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Minor units — money never travels as a float.
          totalMinor: Math.round(amount * 100),
          currency: bid.currency || "AED",
          transitDays: transitDays ? Number(transitDays) : undefined,
          validUntil: new Date(validUntil).toISOString(),
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Quote sent.");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send quote.");
    } finally {
      setBusy(false);
    }
  };

  const r = bid.request;

  return (
    <div className="rounded-xl border border-[#E5E5EA] bg-white overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs font-bold text-[#141414]">{r.reference}</h3>
            <StatusChip status={bid.status} />
          </div>
          <p className="mt-1 text-[11px] text-secondary">
            {r.originCity ? `${r.originCity}, ` : ""}
            {r.originCountry} → {r.destCity ? `${r.destCity}, ` : ""}
            {r.destCountry}
            {r.destPort ? ` (${r.destPort})` : ""}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {r.vehicleCount} vehicle{r.vehicleCount === 1 ? "" : "s"} ·{" "}
            {r.mode.replace(/_/g, " ")} · {r.incoterm}
          </p>
          {r.notes && (
            <p className="mt-1.5 text-[11px] text-secondary italic line-clamp-2">
              {r.notes}
            </p>
          )}
        </div>

        {!decided && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#8136B2] text-white text-[11px] font-semibold hover:bg-[#370B55] transition-colors flex-shrink-0"
          >
            {bid.status === "submitted" ? "Update quote" : "Quote"}
          </button>
        )}
      </div>

      {open && !decided && (
        <div className="border-t border-[#E5E5EA] bg-[#F4F4F6] p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-[11px] font-semibold text-[#141414]">
                All-in total ({bid.currency || "AED"})
              </span>
              <input
                inputMode="decimal"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="8500"
                className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] bg-white px-2 text-xs outline-none focus:border-[#8136B2]"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-[#141414]">
                Transit days
              </span>
              <input
                inputMode="numeric"
                value={transitDays}
                onChange={(e) => setTransitDays(e.target.value)}
                placeholder="21"
                className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] bg-white px-2 text-xs outline-none focus:border-[#8136B2]"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-[#141414]">
                Valid until
              </span>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] bg-white px-2 text-xs outline-none focus:border-[#8136B2]"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[11px] font-semibold text-[#141414]">
              What&apos;s included
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Freight, terminal handling, export customs, marine insurance…"
              className="mt-1 w-full rounded-lg border border-[#E5E5EA] bg-white px-2 py-2 text-xs outline-none focus:border-[#8136B2] resize-none"
            />
          </label>
          <p className="text-[10px] text-muted">
            Quotes are binding until the validity date if the buyer books within
            it. Demurrage and destination duty should be called out separately.
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 h-9 w-full rounded-lg bg-[#141414] text-white text-xs font-semibold hover:bg-[#2E2C28] transition-colors disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Send quote
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string; Icon: typeof Clock }> = {
    invited: {
      cls: "bg-[#1B4FA0]/10 text-[#1B4FA0]",
      label: "New request",
      Icon: Clock,
    },
    submitted: {
      cls: "bg-[#B7791F]/12 text-[#8A5A12]",
      label: "Quote sent",
      Icon: Clock,
    },
    accepted: {
      cls: "bg-[#137A43]/12 text-[#137A43]",
      label: "Won",
      Icon: CheckCircle2,
    },
    rejected: {
      cls: "bg-[#F4F4F6] text-[#63666A]",
      label: "Not selected",
      Icon: XCircle,
    },
  };
  const entry = map[status] ?? map.invited;
  const { Icon } = entry;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${entry.cls}`}
    >
      <Icon className="h-2.5 w-2.5" />
      {entry.label}
    </span>
  );
}
