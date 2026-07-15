"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { emirates } from "@/lib/brand";
import { Building2, Loader2 } from "lucide-react";

const inputCls =
  "w-full h-11 rounded-xl bg-white border border-[#E7E4DA] px-3.5 text-sm text-[#141414] placeholder:text-muted focus:outline-none focus:border-[#141414]/30 focus:ring-2 focus:ring-[#141414]/10";

/**
 * Yard/vendor self-onboarding. Creates the dealer record + flips the signed-in
 * user's role to "dealer" via /api/dealer/onboard, then opens their dashboard.
 */
export function BecomeSellerForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    emirate: "",
    phone: "",
    whatsapp: "",
    tradeLicense: "",
    tagline: "",
  });

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.businessName.trim() || !form.emirate || !form.phone.trim()) {
      toast.error("Business name, emirate, and phone are required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/dealer/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success("You're a verified seller — opening your dashboard.");
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(data.error ?? "Could not complete onboarding.");
      }
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white shadow-card p-6 lg:p-8">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="h-9 w-9 rounded-full bg-[#141414] text-white flex items-center justify-center">
          <Building2 className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-bold text-[#141414]">Set up your yard</h2>
          <p className="text-xs text-secondary">Takes a minute — no card required.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-[#141414] mb-1">
            Business / yard name *
          </label>
          <input
            value={form.businessName}
            onChange={(e) => set("businessName")(e.target.value)}
            placeholder="e.g. Al Quoz Auto Yard"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#141414] mb-1">Emirate *</label>
          <select
            value={form.emirate}
            onChange={(e) => set("emirate")(e.target.value)}
            className={inputCls}
          >
            <option value="">Select emirate</option>
            {emirates.map((e) => (
              <option key={e.id} value={e.en}>
                {e.en}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#141414] mb-1">Phone *</label>
          <input
            value={form.phone}
            onChange={(e) => set("phone")(e.target.value)}
            placeholder="+971 50 000 0000"
            inputMode="tel"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#141414] mb-1">
            WhatsApp <span className="text-muted">(optional)</span>
          </label>
          <input
            value={form.whatsapp}
            onChange={(e) => set("whatsapp")(e.target.value)}
            placeholder="Defaults to phone"
            inputMode="tel"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#141414] mb-1">
            Trade license # <span className="text-muted">(optional)</span>
          </label>
          <input
            value={form.tradeLicense}
            onChange={(e) => set("tradeLicense")(e.target.value)}
            placeholder="For faster verification"
            className={inputCls}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-[#141414] mb-1">
            Tagline <span className="text-muted">(optional)</span>
          </label>
          <input
            value={form.tagline}
            onChange={(e) => set("tagline")(e.target.value)}
            placeholder="e.g. GCC-spec SUVs, export ready"
            className={inputCls}
          />
        </div>
      </div>

      <Button variant="gold" size="lg" className="mt-6 w-full" onClick={submit} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? "Setting up…" : "Create my seller account"}
      </Button>
      <p className="mt-3 text-[11px] text-muted text-center">
        Free plan includes 3 live listings. Upgrade anytime from your dashboard.
      </p>
    </div>
  );
}
