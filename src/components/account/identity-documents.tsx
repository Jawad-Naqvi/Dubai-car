"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import { DocUpload } from "@/components/account/doc-upload";

const inputCls =
  "w-full h-11 rounded-xl bg-white border border-[#E5E5EA] px-3.5 text-sm text-[#141414] placeholder:text-muted focus:outline-none focus:border-[#141414]/30 focus:ring-2 focus:ring-[#141414]/10";

export interface IdentityInitial {
  emiratesIdNumber: string;
  emiratesIdFrontUrl: string;
  emiratesIdBackUrl: string;
  tradeLicense?: string;
  tradeLicenseDocUrl?: string;
}

/**
 * Self-service editor for a user's identity documents & numbers, used from the
 * profile/settings pages so a person can UPDATE what they submitted at signup.
 *  - mode "individual" → Emirates ID only, saved via /api/account/verify-id
 *  - mode "dealer"     → Emirates ID + trade license, saved via /api/dealer/profile
 * Both paths re-check the "one Emirates ID = one account" rule server-side.
 */
export function IdentityDocuments({
  mode,
  initial,
}: {
  mode: "individual" | "dealer";
  initial: IdentityInitial;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    emiratesIdNumber: initial.emiratesIdNumber ?? "",
    emiratesIdFrontUrl: initial.emiratesIdFrontUrl ?? "",
    emiratesIdBackUrl: initial.emiratesIdBackUrl ?? "",
    tradeLicense: initial.tradeLicense ?? "",
    tradeLicenseDocUrl: initial.tradeLicenseDocUrl ?? "",
  });
  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.emiratesIdNumber.trim()) {
      toast.error("Emirates ID number is required.");
      return;
    }
    if (!form.emiratesIdFrontUrl || !form.emiratesIdBackUrl) {
      toast.error("Both sides of your Emirates ID are required.");
      return;
    }
    if (mode === "dealer" && (!form.tradeLicense.trim() || !form.tradeLicenseDocUrl)) {
      toast.error("Trade license number and document are required.");
      return;
    }
    setBusy(true);
    try {
      const endpoint = mode === "dealer" ? "/api/dealer/profile" : "/api/account/verify-id";
      const method = mode === "dealer" ? "PATCH" : "POST";
      const payload =
        mode === "dealer"
          ? {
              emiratesIdNumber: form.emiratesIdNumber,
              emiratesIdFrontUrl: form.emiratesIdFrontUrl,
              emiratesIdBackUrl: form.emiratesIdBackUrl,
              tradeLicense: form.tradeLicense,
              tradeLicenseDocUrl: form.tradeLicenseDocUrl,
            }
          : {
              emiratesIdNumber: form.emiratesIdNumber,
              emiratesIdFrontUrl: form.emiratesIdFrontUrl,
              emiratesIdBackUrl: form.emiratesIdBackUrl,
            };
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok !== false) {
        toast.success("Documents updated.");
        router.refresh();
      } else {
        toast.error(data.error ?? "Could not update your documents.");
      }
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="h-4 w-4 text-[#8136B2]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#141414]">
          Identity &amp; documents
        </h3>
      </div>
      <p className="text-xs text-secondary mb-4 -mt-1">
        Update your Emirates ID{mode === "dealer" ? " and trade license" : ""} anytime. Your Emirates
        ID stays unique to your account.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={mode === "dealer" ? "" : "sm:col-span-2"}>
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
        {mode === "dealer" && (
          <div>
            <label className="block text-xs font-medium text-[#141414] mb-1">Trade license #</label>
            <input
              value={form.tradeLicense}
              onChange={(e) => set("tradeLicense")(e.target.value)}
              placeholder="e.g. DED-123456"
              className={inputCls}
            />
          </div>
        )}
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
        {mode === "dealer" && (
          <div className="sm:col-span-2">
            <DocUpload
              label="Trade license document"
              value={form.tradeLicenseDocUrl}
              onChange={set("tradeLicenseDocUrl")}
            />
          </div>
        )}
      </div>

      <Button variant="gold" size="md" className="mt-5" onClick={save} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? "Saving…" : "Update documents"}
      </Button>
    </div>
  );
}
