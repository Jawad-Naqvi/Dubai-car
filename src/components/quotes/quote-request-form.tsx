"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { formatAED } from "@/lib/utils";

const COUNTRIES = [
  "United Arab Emirates",
  "Saudi Arabia",
  "Nigeria",
  "Ghana",
  "Kenya",
  "Tanzania",
  "South Africa",
  "Zambia",
  "Pakistan",
  "Other",
];

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">
    {children}
  </label>
);

const inputCls =
  "w-full h-9 rounded-md bg-white border border-[#D9D9E0] text-xs text-[#141414] placeholder:text-muted px-2.5 focus:outline-none focus:border-[#8136B2] focus:ring-1 focus:ring-[#8136B2]";

/**
 * Bulk quotation request. Used from a listing ("10 of this car") and from a
 * dealer profile ("20 SUVs, here's my spec" — no listingId). Deliberately
 * short: quantity + requirements + contact, everything else is optional.
 */
export function QuoteRequestForm({
  listingId,
  listingTitle,
  dealerSlug,
  dealerName,
  minQty = 2,
  unitPriceAED,
  onDone,
}: {
  listingId?: string;
  listingTitle?: string;
  dealerSlug?: string;
  dealerName?: string;
  minQty?: number;
  unitPriceAED?: number;
  onDone?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [form, setForm] = useState({
    quantity: String(Math.max(1, minQty)),
    requirements: listingTitle
      ? ""
      : "Vehicle types, model years, spec, and any other requirements…",
    targetUnitPriceAED: "",
    destinationCountry: "",
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    buyerCompany: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const qty = Number(form.quantity) || 0;
  const indicativeTotal = unitPriceAED && qty > 0 ? unitPriceAED * qty : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.buyerName || !form.buyerEmail) {
      toast.error("Please add your name and email.");
      return;
    }
    if (qty < minQty) {
      toast.error(`This seller accepts bulk requests from ${minQty} units.`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          dealerSlug,
          quantity: qty,
          requirements: form.requirements || undefined,
          targetUnitPriceAED: form.targetUnitPriceAED
            ? Number(form.targetUnitPriceAED)
            : undefined,
          destinationCountry: form.destinationCountry || undefined,
          buyerName: form.buyerName,
          buyerEmail: form.buyerEmail,
          buyerPhone: form.buyerPhone || undefined,
          buyerCompany: form.buyerCompany || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      setDone(data.reference);
      toast.success(`Quote request ${data.reference} sent`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-4">
        <CheckCircle2 className="h-10 w-10 text-[#137A43] mx-auto" />
        <h3 className="mt-3 text-base font-bold text-[#141414]">
          Request {done} sent
        </h3>
        <p className="mt-1.5 text-xs text-[#63666A] max-w-xs mx-auto leading-relaxed">
          {dealerName ?? "The seller"} has been notified by email and WhatsApp.
          You&apos;ll get their pricing in your dashboard under{" "}
          <span className="font-semibold text-[#141414]">Quote requests</span>.
        </p>
        <Button
          variant="gold"
          size="md"
          className="mt-4"
          onClick={() => onDone?.()}
        >
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Quantity *</FieldLabel>
          <input
            className={inputCls}
            type="number"
            min={minQty}
            value={form.quantity}
            onChange={(e) => set("quantity", e.target.value)}
          />
          <p className="mt-1 text-[10px] text-muted">Minimum {minQty} units</p>
        </div>
        <div>
          <FieldLabel>Target price / unit</FieldLabel>
          <input
            className={inputCls}
            type="number"
            min={0}
            placeholder="Optional"
            value={form.targetUnitPriceAED}
            onChange={(e) => set("targetUnitPriceAED", e.target.value)}
          />
          {indicativeTotal !== null && (
            <p className="mt-1 text-[10px] text-muted">
              List total ≈ {formatAED(indicativeTotal)}
            </p>
          )}
        </div>
      </div>

      <div>
        <FieldLabel>
          {listingTitle ? "Additional requirements" : "What do you need? *"}
        </FieldLabel>
        <textarea
          className="w-full rounded-md bg-white border border-[#D9D9E0] text-xs text-[#141414] placeholder:text-muted px-2.5 py-2 focus:outline-none focus:border-[#8136B2] focus:ring-1 focus:ring-[#8136B2] min-h-[80px]"
          value={form.requirements}
          onChange={(e) => set("requirements", e.target.value)}
          placeholder={
            listingTitle
              ? "Colour split, spec, delivery timeline, payment terms…"
              : "e.g. 20 × 2023–2024 Land Cruiser / Patrol, GCC spec, white preferred"
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Company</FieldLabel>
          <input
            className={inputCls}
            value={form.buyerCompany}
            onChange={(e) => set("buyerCompany", e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <FieldLabel>Destination</FieldLabel>
          <select
            className={inputCls}
            value={form.destinationCountry}
            onChange={(e) => set("destinationCountry", e.target.value)}
          >
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-1 border-t border-[#E5E5EA]" />

      <div>
        <FieldLabel>Full name *</FieldLabel>
        <input
          className={inputCls}
          value={form.buyerName}
          onChange={(e) => set("buyerName", e.target.value)}
          placeholder="Your name"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Email *</FieldLabel>
          <input
            className={inputCls}
            type="email"
            value={form.buyerEmail}
            onChange={(e) => set("buyerEmail", e.target.value)}
            placeholder="you@company.com"
          />
        </div>
        <div>
          <FieldLabel>Phone / WhatsApp</FieldLabel>
          <input
            className={inputCls}
            value={form.buyerPhone}
            onChange={(e) => set("buyerPhone", e.target.value)}
            placeholder="+971 5…"
          />
        </div>
      </div>

      <Button
        type="submit"
        variant="gold"
        size="md"
        className="w-full"
        disabled={loading}
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Send quote request
      </Button>
      <p className="text-[10px] text-muted text-center leading-relaxed">
        No account needed. You&apos;ll be notified by email and WhatsApp when the
        seller responds with pricing.
      </p>
    </form>
  );
}
