"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { formatAED } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QuoteStatusBadge } from "./quote-status-badge";
import type { QuoteView } from "@/lib/data/quotes";
import {
  Loader2,
  Send,
  Layers,
  Building2,
  MapPin,
  Package,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Audience = "buyer" | "seller";

const FILTERS = [
  { key: "open", label: "Open" },
  { key: "responded", label: "Quoted" },
  { key: "accepted", label: "Accepted" },
  { key: "closed", label: "Closed" },
  { key: "all", label: "All" },
] as const;

function inFilter(q: QuoteView, key: string): boolean {
  switch (key) {
    case "open":
      return q.status === "requested" || q.status === "under_review";
    case "responded":
      return q.status === "responded";
    case "accepted":
      return q.status === "accepted";
    case "closed":
      return ["declined", "withdrawn", "expired"].includes(q.status);
    default:
      return true;
  }
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * One workspace, two audiences. Buyers review incoming pricing and accept or
 * decline; sellers price requests. Both share the same thread so a quote is a
 * conversation, not a form submission that disappears.
 */
export function QuotesWorkspace({
  quotes: initial,
  audience,
}: {
  quotes: QuoteView[];
  audience: Audience;
}) {
  const router = useRouter();
  const [quotes, setQuotes] = useState(initial);
  const [filter, setFilter] = useState<string>("open");
  const [activeId, setActiveId] = useState<string | null>(
    initial[0]?.id ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");

  const visible = useMemo(
    () => quotes.filter((q) => inFilter(q, filter)),
    [quotes, filter],
  );
  const active = quotes.find((q) => q.id === activeId) ?? visible[0] ?? null;

  const patch = (updated: QuoteView) =>
    setQuotes((list) => list.map((q) => (q.id === updated.id ? updated : q)));

  const call = async (body: Record<string, unknown>, ok: string) => {
    if (!active) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/quotes/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      if (data.quote) patch(data.quote);
      toast.success(
        data.orderReference ? `${ok} · Order ${data.orderReference}` : ok,
      );
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const sendMessage = async () => {
    if (!active || !message.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/quotes/${active.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: message.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send");
      patch({
        ...active,
        messages: [...active.messages, data.message],
      });
      setMessage("");
      toast.success("Message sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send message");
    } finally {
      setBusy(false);
    }
  };

  if (quotes.length === 0) {
    return (
      <div className="rounded-lg bg-white border border-[#E5E5EA] p-10 text-center">
        <Layers className="h-8 w-8 text-muted mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-[#141414]">
          {audience === "buyer"
            ? "No quote requests yet"
            : "No quote requests yet"}
        </h3>
        <p className="mt-1 text-xs text-muted max-w-sm mx-auto leading-relaxed">
          {audience === "buyer"
            ? "Buying several cars at once? Open any listing marked “Bulk available” — or a dealer's profile — and request a quote."
            : "When a business buyer requests bulk pricing on your stock, it lands here. Mark listings as bulk-available to attract them."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Status filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map((f) => {
          const count = quotes.filter((q) => inFilter(q, f.key)).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "h-7 px-3 rounded-full border text-[11px] font-medium transition-colors",
                filter === f.key
                  ? "bg-[#141414] text-white border-[#141414]"
                  : "bg-white text-secondary border-[#E5E5EA] hover:border-[#141414]/30",
              )}
            >
              {f.label}
              <span className="ml-1 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-3 items-start">
        {/* List */}
        <div className="rounded-lg bg-white border border-[#E5E5EA] overflow-hidden divide-y divide-[#E5E5EA] max-h-[70vh] overflow-y-auto">
          {visible.length === 0 && (
            <p className="p-5 text-xs text-muted text-center">
              Nothing in this view.
            </p>
          )}
          {visible.map((q) => (
            <button
              key={q.id}
              onClick={() => setActiveId(q.id)}
              className={cn(
                "w-full text-left p-3 transition-colors",
                active?.id === q.id ? "bg-[#F3EDF9]" : "hover:bg-[#F4F4F6]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#141414]">
                  {q.reference}
                </span>
                <QuoteStatusBadge status={q.status} audience={audience} />
              </div>
              <p className="mt-1 text-xs font-semibold text-[#141414] truncate">
                {q.listingTitle ?? "Bulk vehicle enquiry"}
              </p>
              <p className="mt-0.5 text-[11px] text-[#63666A] truncate">
                {q.quantity} units ·{" "}
                {audience === "buyer"
                  ? q.dealerName
                  : q.buyerCompany || q.buyerName || "Buyer"}
              </p>
              <p className="mt-0.5 text-[10px] text-muted">
                {timeAgo(q.createdAt)}
              </p>
            </button>
          ))}
        </div>

        {/* Detail */}
        {active && (
          <div className="rounded-lg bg-white border border-[#E5E5EA] p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-[#141414]">
                    {active.listingTitle ?? "Bulk vehicle enquiry"}
                  </h2>
                  <QuoteStatusBadge status={active.status} audience={audience} />
                </div>
                <p className="mt-0.5 text-xs text-[#63666A]">
                  {active.reference} · requested {timeAgo(active.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-[#141414] leading-none">
                  {active.quotedTotalAED
                    ? formatAED(active.quotedTotalAED)
                    : "—"}
                </div>
                <div className="text-[11px] text-muted mt-1">
                  {active.quotedUnitPriceAED
                    ? `${formatAED(active.quotedUnitPriceAED)} / unit`
                    : "Awaiting pricing"}
                </div>
              </div>
            </div>

            {/* Facts */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted">
                  Quantity
                </div>
                <div className="mt-0.5 font-semibold text-[#141414] flex items-center gap-1">
                  <Package className="h-3 w-3 text-muted" />
                  {active.quotedQuantity ?? active.quantity} units
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted">
                  {audience === "buyer" ? "Seller" : "Buyer"}
                </div>
                <div className="mt-0.5 font-semibold text-[#141414] truncate flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-muted" />
                  {audience === "buyer"
                    ? active.dealerName
                    : active.buyerCompany || active.buyerName || "—"}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted">
                  Destination
                </div>
                <div className="mt-0.5 font-semibold text-[#141414] truncate flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted" />
                  {active.destinationCountry ?? "UAE"}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted">
                  Target / unit
                </div>
                <div className="mt-0.5 font-semibold text-[#141414]">
                  {active.targetUnitPriceAED
                    ? formatAED(active.targetUnitPriceAED)
                    : "—"}
                </div>
              </div>
            </div>

            {active.requirements && (
              <div className="mt-4">
                <div className="text-[10px] uppercase tracking-wider text-muted">
                  Requirements
                </div>
                <p className="mt-1 text-xs text-[#63666A] leading-relaxed whitespace-pre-wrap">
                  {active.requirements}
                </p>
              </div>
            )}

            {active.quotedNotes && (
              <div className="mt-4 rounded-md bg-[#F4F4F6] p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted">
                  Seller notes
                </div>
                <p className="mt-1 text-xs text-[#141414] leading-relaxed whitespace-pre-wrap">
                  {active.quotedNotes}
                </p>
              </div>
            )}

            {/* Seller: price the request */}
            {audience === "seller" &&
              ["requested", "under_review", "responded"].includes(
                active.status,
              ) && (
                <div className="mt-5 pt-5 border-t border-[#E5E5EA]">
                  <h3 className="text-sm font-bold text-[#141414]">
                    {active.status === "responded"
                      ? "Update your quote"
                      : "Respond with pricing"}
                  </h3>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">
                        Unit price (AED) *
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder={String(active.quotedUnitPriceAED ?? "")}
                        className="w-full h-9 rounded-md border border-[#D9D9E0] px-2.5 text-xs focus:outline-none focus:border-[#8136B2] focus:ring-1 focus:ring-[#8136B2]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">
                        Quantity you can supply
                      </label>
                      <input
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        placeholder={String(active.quantity)}
                        className="w-full h-9 rounded-md border border-[#D9D9E0] px-2.5 text-xs focus:outline-none focus:border-[#8136B2] focus:ring-1 focus:ring-[#8136B2]"
                      />
                    </div>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Lead time, payment terms, what's included…"
                    className="mt-3 w-full rounded-md border border-[#D9D9E0] px-2.5 py-2 text-xs min-h-[64px] focus:outline-none focus:border-[#8136B2] focus:ring-1 focus:ring-[#8136B2]"
                  />
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="gold"
                      size="md"
                      disabled={busy || !price}
                      onClick={() =>
                        call(
                          {
                            action: "respond",
                            quotedUnitPriceAED: Number(price),
                            quotedQuantity: qty ? Number(qty) : undefined,
                            quotedNotes: notes || undefined,
                          },
                          "Quote sent to the buyer",
                        )
                      }
                    >
                      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Send quote
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      disabled={busy}
                      onClick={() =>
                        call(
                          { action: "decline", by: "seller", reason: notes || undefined },
                          "Request declined",
                        )
                      }
                    >
                      Can&apos;t fulfil
                    </Button>
                  </div>
                </div>
              )}

            {/* Buyer: decide */}
            {audience === "buyer" && active.status === "responded" && (
              <div className="mt-5 pt-5 border-t border-[#E5E5EA]">
                <h3 className="text-sm font-bold text-[#141414]">
                  Your decision
                </h3>
                <p className="mt-1 text-xs text-[#63666A]">
                  Accepting creates an order with {active.dealerName} and
                  notifies them immediately.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="gold"
                    size="md"
                    disabled={busy}
                    onClick={() => call({ action: "accept" }, "Quote accepted")}
                  >
                    {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Accept &amp; create order
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    disabled={busy}
                    onClick={() =>
                      call({ action: "decline", by: "buyer" }, "Quote declined")
                    }
                  >
                    Decline
                  </Button>
                </div>
              </div>
            )}

            {/* Thread */}
            <div className="mt-5 pt-5 border-t border-[#E5E5EA]">
              <h3 className="text-sm font-bold text-[#141414] flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-muted" />
                Discussion
              </h3>
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {active.messages.length === 0 && (
                  <p className="text-xs text-muted">
                    No messages yet — ask a question or negotiate terms here.
                  </p>
                )}
                {active.messages.map((m, i) => {
                  const mine =
                    (audience === "buyer" && m.senderRole === "buyer") ||
                    (audience === "seller" && m.senderRole === "dealer");
                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-md px-3 py-2 text-xs max-w-[85%]",
                        mine
                          ? "bg-[#F3EDF9] ms-auto"
                          : "bg-[#F4F4F6]",
                      )}
                    >
                      <div className="text-[10px] text-muted mb-0.5">
                        {m.senderRole === "buyer" ? "Buyer" : "Seller"} ·{" "}
                        {timeAgo(m.createdAt)}
                      </div>
                      <p className="text-[#141414] whitespace-pre-wrap">{m.body}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Write a message…"
                  className="flex-1 h-9 rounded-md border border-[#D9D9E0] px-2.5 text-xs focus:outline-none focus:border-[#8136B2] focus:ring-1 focus:ring-[#8136B2]"
                />
                <Button
                  variant="gold"
                  size="md"
                  disabled={busy || !message.trim()}
                  onClick={sendMessage}
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
