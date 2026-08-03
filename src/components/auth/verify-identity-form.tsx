"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import { DocUpload } from "@/components/account/doc-upload";

const inputCls =
  "w-full h-11 rounded-xl bg-white border border-[#E5E5EA] px-3.5 text-sm text-[#141414] placeholder:text-muted focus:outline-none focus:border-[#141414]/30 focus:ring-2 focus:ring-[#141414]/10";

/**
 * Individual identity verification — Emirates ID number + front/back scans.
 * Required for every individual account before they can sell; the number is
 * globally unique (one Emirates ID → one account). Posts to
 * /api/account/verify-id. Dealers use the richer become-seller flow instead.
 */
export function VerifyIdentityForm({ redirectTo = "/dashboard" }: { redirectTo?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    emiratesIdNumber: "",
    emiratesIdFrontUrl: "",
    emiratesIdBackUrl: "",
  });

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.emiratesIdNumber.trim()) {
      toast.error("Emirates ID number is required.");
      return;
    }
    if (!form.emiratesIdFrontUrl || !form.emiratesIdBackUrl) {
      toast.error("Please upload both the front and back of your Emirates ID.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/account/verify-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success("Identity verified — you can now buy and sell.");
        router.push(redirectTo);
        router.refresh();
      } else {
        toast.error(data.error ?? "Could not verify your identity.");
      }
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white shadow-card p-6 lg:p-8">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="h-9 w-9 rounded-full bg-[#141414] text-white flex items-center justify-center">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-bold text-[#141414]">Verify your Emirates ID</h2>
          <p className="text-xs text-secondary">
            Required once — then you can both buy and sell on DXB Motors.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-[#141414] mb-1">
            Emirates ID number *
          </label>
          <input
            value={form.emiratesIdNumber}
            onChange={(e) => set("emiratesIdNumber")(e.target.value)}
            placeholder="784-XXXX-XXXXXXX-X"
            inputMode="numeric"
            className={inputCls}
          />
        </div>
        <DocUpload
          label="Emirates ID — front"
          value={form.emiratesIdFrontUrl}
          onChange={set("emiratesIdFrontUrl")}
        />
        <DocUpload
          label="Emirates ID — back"
          value={form.emiratesIdBackUrl}
          onChange={set("emiratesIdBackUrl")}
        />
      </div>

      <Button variant="gold" size="lg" className="mt-6 w-full" onClick={submit} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? "Verifying…" : "Verify identity"}
      </Button>
      <p className="mt-3 text-[11px] text-muted text-center">
        Your ID is stored securely and only used for verification. One Emirates ID can be linked to a
        single account.
      </p>
    </div>
  );
}
