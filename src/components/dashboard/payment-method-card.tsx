"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { brand } from "@/lib/brand";
import { CreditCard, Loader2 } from "lucide-react";

/**
 * Replaces a previously hardcoded "Visa ···· 4242" card — that was static
 * JSX, not a real payment method. Once Stripe is configured this opens the
 * real Stripe customer billing portal; until then it's an honest empty state.
 */
export function PaymentMethodCard({ gatewayEnabled }: { gatewayEnabled: boolean }) {
  const [busy, setBusy] = useState(false);

  const openPortal = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/payments/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open billing portal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-5">
      <Eyebrow tone="emerald">PAYMENT METHOD</Eyebrow>
      <div className="mt-4 flex items-center gap-4">
        <div className="h-12 w-16 rounded-lg bg-[#141414] flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="font-semibold">
            {gatewayEnabled ? "Managed via Stripe" : "No payment method on file"}
          </div>
          <div className="text-xs text-muted">
            {gatewayEnabled
              ? "Cards are stored securely by Stripe, not on our servers."
              : "Added automatically the first time you upgrade a plan."}
          </div>
        </div>
      </div>
      {gatewayEnabled ? (
        <Button variant="ghost" size="sm" className="mt-5 w-full" onClick={openPortal} disabled={busy}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Manage in Stripe"}
        </Button>
      ) : (
        <Button asChild variant="ghost" size="sm" className="mt-5 w-full">
          <a
            href={`mailto:${brand.supportEmail}?subject=${encodeURIComponent("Billing question")}`}
          >
            Contact billing support
          </a>
        </Button>
      )}
    </div>
  );
}
