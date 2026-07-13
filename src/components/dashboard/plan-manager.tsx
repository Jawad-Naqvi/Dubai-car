"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Modal } from "@/components/ui/modal";
import { subscriptionTiers } from "@/lib/brand";
import { formatAED } from "@/lib/utils";
import { Check, Loader2, CreditCard } from "lucide-react";

export function PlanManager({
  currentTier,
  listingsUsed,
  listingQuota,
}: {
  currentTier: string;
  listingsUsed: number;
  listingQuota: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const active = subscriptionTiers.find((t) => t.id === currentTier);

  const choose = async (tierId: string) => {
    setBusy(tierId);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(
        data.gatewayLive
          ? "Redirecting to secure checkout…"
          : `Switched to ${subscriptionTiers.find((t) => t.id === tierId)?.name} (demo)`,
      );
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change plan");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="lg:col-span-2 rounded-2xl bg-bento-dark border border-[#F0941F]/25 shadow-card p-7 relative overflow-hidden grain">
        <Eyebrow tone="gold">CURRENT PLAN</Eyebrow>
        <div className="mt-4 flex items-baseline gap-3 flex-wrap">
          <span className="text-base font-bold">{active?.name ?? "Free"}</span>
          <span className="text-muted">
            {active?.monthlyAED ? `${formatAED(active.monthlyAED)} / month` : "Free"}
          </span>
          <Badge tone="verified">ACTIVE</Badge>
        </div>
        <p className="mt-2 text-xs text-secondary">
          {listingsUsed}/{listingQuota === Infinity ? "∞" : listingQuota} listings used
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="gold" size="md" onClick={() => setOpen(true)}>
            Change plan
          </Button>
        </div>
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Choose your plan"
        description="Switch anytime. Charges are prorated."
        className="max-w-2xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subscriptionTiers.map((t) => {
            const isCurrent = t.id === currentTier;
            return (
              <div
                key={t.id}
                className={`rounded-xl border p-4 ${
                  isCurrent ? "border-[#F0941F]/50 bg-[#F0941F]/10" : "border-[#E7E4DA]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{t.name}</span>
                  {t.recommended && <Badge tone="featured">POPULAR</Badge>}
                </div>
                <div className="mt-1 text-lg font-bold text-[#141414]">
                  {t.monthlyAED ? formatAED(t.monthlyAED) : "Free"}
                  {t.monthlyAED > 0 && (
                    <span className="text-[10px] text-muted font-normal"> /mo</span>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-muted">
                  {t.listings === Infinity ? "Unlimited" : `Up to ${t.listings}`} listings
                </div>
                <ul className="mt-3 space-y-1">
                  {t.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[11px] text-secondary">
                      <Check className="h-3 w-3 text-[#F0941F] mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? "ghost" : "gold"}
                  size="sm"
                  className="mt-4 w-full"
                  disabled={isCurrent || busy !== null}
                  onClick={() => choose(t.id)}
                >
                  {busy === t.id && <Loader2 className="h-3 w-3 animate-spin" />}
                  {isCurrent ? "Current plan" : `Switch to ${t.name}`}
                </Button>
              </div>
            );
          })}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted">
          <CreditCard className="h-3 w-3" />
          Secured by PayTabs (UAE) &amp; Stripe. Demo mode simulates checkout.
        </p>
      </Modal>
    </>
  );
}
