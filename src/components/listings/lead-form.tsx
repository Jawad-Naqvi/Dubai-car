"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export type LeadType =
  | "inquiry"
  | "contact_unlock"
  | "test_drive"
  | "export_inquiry";

const COUNTRIES = [
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
  "w-full h-9 rounded-xl bg-white border border-[#E5E5EA] text-xs text-[#141414] placeholder:text-muted px-2.5 focus:outline-none focus:border-[#141414]/40 focus:ring-2 focus:ring-[#141414]/10";

export function LeadForm({
  listingId,
  listingTitle,
  type,
  onDone,
  submitLabel = "Send inquiry",
}: {
  listingId?: string;
  listingTitle?: string;
  type: LeadType;
  onDone?: () => void;
  submitLabel?: string;
}) {
  const isExport = type === "export_inquiry";
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: listingTitle
      ? `Hi, I'm interested in the ${listingTitle}.`
      : "",
    destinationCountry: "",
    quantity: "1",
    shippingPreference: "RoRo",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || (!form.phone && !form.email)) {
      toast.error("Please add your name and a phone or email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          type,
          buyerName: form.name,
          buyerEmail: form.email,
          buyerPhone: form.phone,
          message: form.message,
          ...(isExport && {
            destinationCountry: form.destinationCountry,
            quantity: Number(form.quantity) || 1,
            shippingPreference: form.shippingPreference,
          }),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(
        isExport
          ? "Export request sent — our team will email you a quote."
          : "Inquiry sent! The seller will be in touch shortly.",
      );
      onDone?.();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        <div>
          <FieldLabel>Full name *</FieldLabel>
          <input
            className={inputCls}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Phone</FieldLabel>
            <input
              className={inputCls}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+971 5..."
            />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <input
              className={inputCls}
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@email.com"
            />
          </div>
        </div>

        {isExport && (
          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <FieldLabel>Quantity</FieldLabel>
              <input
                className={inputCls}
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
              />
            </div>
          </div>
        )}

        <div>
          <FieldLabel>Message</FieldLabel>
          <textarea
            className="w-full rounded-xl bg-white border border-[#E5E5EA] text-xs text-[#141414] placeholder:text-muted px-2.5 py-2 focus:outline-none focus:border-[#141414]/40 focus:ring-2 focus:ring-[#141414]/10 min-h-[72px]"
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="Add any details…"
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
        {submitLabel}
      </Button>
      <p className="text-[10px] text-muted text-center">
        By submitting you agree to be contacted about this vehicle.
      </p>
    </form>
  );
}
