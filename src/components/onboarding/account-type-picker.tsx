"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { User, Building2, Loader2, ArrowRight, Ship } from "lucide-react";

/**
 * Step one of onboarding, shown AFTER sign-up rather than before it.
 *
 * Everyone creates the same kind of account from the same sign-up page; this
 * is where they say what they're here to do. Only buyer and dealer appear —
 * freight forwarders arrive through an admin invitation, so the option is
 * absent from the picker rather than merely disabled.
 */
export function AccountTypePicker({ locale }: { locale: string }) {
  const router = useRouter();
  const [choice, setChoice] = useState<"buyer" | "dealer" | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (type: "buyer" | "dealer") => {
    if (type === "dealer" && !businessName.trim()) {
      setChoice("dealer");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/onboarding/choose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          organizationName: type === "dealer" ? businessName.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (type === "dealer") {
        router.push("/onboarding/verify");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your choice.");
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => submit("buyer")}
        className="group flex items-center gap-3.5 rounded-2xl border border-[#E5E5EA] bg-white px-4 py-4 text-left hover:border-[#141414]/30 hover:shadow-card transition-all disabled:opacity-60"
      >
        <span className="h-10 w-10 rounded-xl bg-[#F4F4F6] grid place-items-center flex-shrink-0 group-hover:bg-[#141414] transition-colors">
          <User className="h-5 w-5 text-[#8136B2] group-hover:text-white transition-colors" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-[#141414]">
            I&apos;m here to buy a car
          </span>
          <span className="block text-xs text-secondary mt-0.5">
            Browse, save and message sellers. You can start selling later.
          </span>
        </span>
        <ArrowRight className="h-4 w-4 text-muted flex-shrink-0" />
      </button>

      <div
        className={`rounded-2xl border bg-white transition-all ${
          choice === "dealer"
            ? "border-[#8136B2] shadow-card"
            : "border-[#E5E5EA] hover:border-[#141414]/30"
        }`}
      >
        <button
          type="button"
          disabled={busy}
          onClick={() => setChoice(choice === "dealer" ? null : "dealer")}
          className="group flex w-full items-center gap-3.5 px-4 py-4 text-left disabled:opacity-60"
        >
          <span className="h-10 w-10 rounded-xl bg-[#F4F4F6] grid place-items-center flex-shrink-0 group-hover:bg-[#141414] transition-colors">
            <Building2 className="h-5 w-5 text-[#8136B2] group-hover:text-white transition-colors" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[#141414]">
              I&apos;m here to sell cars
            </span>
            <span className="block text-xs text-secondary mt-0.5">
              Get a seller workspace now. Verification unlocks publishing.
            </span>
          </span>
          <ArrowRight className="h-4 w-4 text-muted flex-shrink-0" />
        </button>

        {choice === "dealer" && (
          <div className="border-t border-[#E5E5EA] p-4 space-y-3">
            <label className="block">
              <span className="text-[11px] font-semibold text-[#141414]">
                Business name
              </span>
              <input
                autoFocus
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Al Futtaim Motors"
                className="mt-1 w-full h-10 rounded-lg border border-[#E5E5EA] px-3 text-sm outline-none focus:border-[#8136B2]"
              />
              <span className="mt-1 block text-[11px] text-muted">
                Trading as an individual? Use your own name.
              </span>
            </label>
            <button
              type="button"
              disabled={busy || !businessName.trim()}
              onClick={() => submit("dealer")}
              className="inline-flex items-center justify-center gap-2 h-10 w-full rounded-lg bg-[#8136B2] text-white text-xs font-semibold hover:bg-[#370B55] transition-colors disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Forwarders are invitation-only; this points them at the front door
          rather than pretending there is a self-serve path. */}
      <div className="mt-1 flex items-start gap-3 rounded-xl bg-[#F4F4F6] px-4 py-3">
        <Ship className="h-4 w-4 text-[#63666A] flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-secondary leading-relaxed">
          Run a freight forwarding company?{" "}
          <a
            href={`/${locale}/partners/apply`}
            className="font-semibold text-[#141414] underline underline-offset-2 hover:text-[#6B21A8]"
          >
            Apply to join our partner network
          </a>{" "}
          — we review each application and send an onboarding link.
        </p>
      </div>
    </div>
  );
}
