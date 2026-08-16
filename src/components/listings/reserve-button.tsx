"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatAED } from "@/lib/utils";

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">
    {children}
  </label>
);

const inputCls =
  "w-full h-9 rounded-md bg-white border border-[#D9D9E0] text-xs text-[#141414] placeholder:text-muted px-2.5 focus:outline-none focus:border-[#8136B2] focus:ring-1 focus:ring-[#8136B2]";

/**
 * B2C purchase step: reserves a single priced car and opens an order the buyer
 * can track. Deliberately not a card-payment checkout — UAE car sales close at
 * the showroom, so this creates the order and hands the buyer to the dealer,
 * which is what "Buy" realistically means here.
 */
export function ReserveButton({
  listingId,
  listingTitle,
  priceAED,
  className,
}: {
  listingId: string;
  listingTitle: string;
  priceAED: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Please add your name and email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          buyerName: form.name,
          buyerEmail: form.email,
          buyerPhone: form.phone || undefined,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not reserve");
      setReference(data.order?.reference ?? "your order");
      toast.success("Reservation sent to the seller");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="gold"
        size="md"
        className={className}
        onClick={() => setOpen(true)}
      >
        <ShoppingBag className="h-4 w-4" />
        Reserve this car
      </Button>

      <Modal
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setReference(null);
        }}
        title={reference ? "Reservation confirmed" : "Reserve this car"}
        description={
          reference
            ? undefined
            : `${listingTitle} · ${formatAED(priceAED)}`
        }
      >
        {reference ? (
          <div className="text-center py-4">
            <CheckCircle2 className="h-10 w-10 text-[#137A43] mx-auto" />
            <h3 className="mt-3 text-base font-bold text-[#141414]">
              Order {reference} created
            </h3>
            <p className="mt-1.5 text-xs text-[#63666A] max-w-xs mx-auto leading-relaxed">
              The seller has been notified and will confirm availability and
              next steps. Track it under{" "}
              <span className="font-semibold text-[#141414]">My orders</span>.
            </p>
            <Button
              variant="gold"
              size="md"
              className="mt-4"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="rounded-md bg-[#F4F4F6] px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs text-[#63666A]">Vehicle price</span>
              <span className="text-base font-bold text-[#141414]">
                {formatAED(priceAED)}
              </span>
            </div>
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
                <FieldLabel>Email *</FieldLabel>
                <input
                  className={inputCls}
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <FieldLabel>Phone / WhatsApp</FieldLabel>
                <input
                  className={inputCls}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+971 5…"
                />
              </div>
            </div>
            <div>
              <FieldLabel>Notes for the seller</FieldLabel>
              <textarea
                className="w-full rounded-md bg-white border border-[#D9D9E0] text-xs text-[#141414] placeholder:text-muted px-2.5 py-2 focus:outline-none focus:border-[#8136B2] focus:ring-1 focus:ring-[#8136B2] min-h-[64px]"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Finance needed, viewing time, trade-in…"
              />
            </div>
            <Button
              type="submit"
              variant="gold"
              size="md"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Reserve this car
            </Button>
            <p className="text-[10px] text-muted text-center leading-relaxed">
              No payment now. This reserves the car with the seller and opens an
              order you can track.
            </p>
          </form>
        )}
      </Modal>
    </>
  );
}
