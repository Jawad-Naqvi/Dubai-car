"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Loan pre-approval capture. Replaces the old dead-end "/contact" link: collects
 * the applicant + income and files a real `finance_preapproval` lead (delivered
 * to ops/dealer via the same notification pipeline as buyer enquiries).
 */
export function FinancePreapprovalButton({
  amount,
  termYears,
  aprFrom,
  bank,
  variant = "gold",
  size = "lg",
  label = "Get pre-approved",
  className,
}: {
  amount?: number;
  termYears?: number;
  aprFrom?: number;
  bank?: string;
  variant?: "gold" | "ghost";
  size?: "lg" | "sm";
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const phone = String(f.get("phone") ?? "").trim();
    const email = String(f.get("email") ?? "").trim();
    const income = String(f.get("income") ?? "").trim();
    const employment = String(f.get("employment") ?? "").trim();
    if (!name || !phone) {
      toast.error("Name and phone are required.");
      return;
    }
    const message = [
      `Finance pre-approval request${bank ? ` — ${bank}` : ""}.`,
      amount ? `Loan amount: AED ${amount.toLocaleString()}` : null,
      termYears ? `Term: ${termYears} years` : null,
      aprFrom ? `Rate from: ${aprFrom}%` : null,
      income ? `Monthly income: AED ${income}` : null,
      employment ? `Employment: ${employment}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    setBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "finance_preapproval",
          buyerName: name,
          buyerPhone: phone,
          buyerEmail: email,
          message,
        }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      toast.success("Application received", {
        description: "A finance specialist will contact you shortly.",
      });
    } catch {
      toast.error("Could not submit. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn("w-full", className)}
        onClick={() => {
          setDone(false);
          setOpen(true);
        }}
      >
        {label}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Loan pre-approval"
            className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-[#E7E4DA] p-5"
          >
            {done ? (
              <div className="text-center py-6">
                <ShieldCheck className="h-10 w-10 text-[#137A43] mx-auto" />
                <h3 className="mt-3 text-base font-bold">Application received</h3>
                <p className="mt-1 text-xs text-secondary">
                  A finance specialist will reach out on {` `}the number you
                  provided.
                </p>
                <Button
                  variant="gold"
                  size="sm"
                  className="mt-5"
                  onClick={() => setOpen(false)}
                >
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <h3 className="text-base font-bold">Get pre-approved</h3>
                  <p className="text-xs text-muted">
                    No impact on your credit score.
                    {amount
                      ? ` For AED ${amount.toLocaleString()} over ${termYears} years.`
                      : ""}
                  </p>
                </div>
                <input
                  name="name"
                  required
                  placeholder="Full name"
                  className="w-full h-9 rounded-lg border border-[#E5E5E5] px-3 text-sm focus:outline-none focus:border-[#C8A93E]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="phone"
                    required
                    inputMode="tel"
                    placeholder="Phone"
                    className="w-full h-9 rounded-lg border border-[#E5E5E5] px-3 text-sm focus:outline-none focus:border-[#C8A93E]"
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder="Email (optional)"
                    className="w-full h-9 rounded-lg border border-[#E5E5E5] px-3 text-sm focus:outline-none focus:border-[#C8A93E]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="income"
                    inputMode="numeric"
                    placeholder="Monthly income (AED)"
                    className="w-full h-9 rounded-lg border border-[#E5E5E5] px-3 text-sm focus:outline-none focus:border-[#C8A93E]"
                  />
                  <select
                    name="employment"
                    defaultValue=""
                    className="w-full h-9 rounded-lg border border-[#E5E5E5] px-2 text-sm text-secondary focus:outline-none focus:border-[#C8A93E]"
                  >
                    <option value="" disabled>
                      Employment
                    </option>
                    <option>Salaried</option>
                    <option>Self-employed</option>
                    <option>Business owner</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="gold"
                    size="sm"
                    className="flex-1"
                    disabled={busy}
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Submit application"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
