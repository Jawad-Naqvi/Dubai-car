"use client";

import { useRef, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { emirates } from "@/lib/brand";
import { Building2, Loader2, Upload, FileCheck2, ShieldCheck } from "lucide-react";

const inputCls =
  "w-full h-11 rounded-xl bg-white border border-[#E7E4DA] px-3.5 text-sm text-[#141414] placeholder:text-muted focus:outline-none focus:border-[#141414]/30 focus:ring-2 focus:ring-[#141414]/10";

function DocUpload({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/upload-doc", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.urls[0]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-[#141414] mb-1">{label} *</label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`flex w-full items-center gap-2 h-11 rounded-xl border px-3.5 text-sm transition-colors ${
          value
            ? "border-[#137A43]/30 bg-[#137A43]/5 text-[#137A43]"
            : "border-dashed border-[#D8D4C6] bg-[#F3F1E9] text-secondary hover:border-[#141414]/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files)}
        />
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : value ? (
          <FileCheck2 className="h-4 w-4" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        <span className="truncate">
          {uploading ? "Uploading…" : value ? "Uploaded — tap to replace" : "Upload JPG, PNG, or PDF"}
        </span>
      </button>
    </div>
  );
}

/**
 * Seller/KYC application. Submits business + Emirates ID + trade license
 * details via /api/dealer/onboard, which creates a *pending* dealer record —
 * an admin must approve it before the account becomes a live "dealer" (see
 * /admin/dealers). Does not open the dashboard on submit.
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
    tradeLicenseDocUrl: "",
    tagline: "",
    emiratesIdNumber: "",
    emiratesIdFrontUrl: "",
    emiratesIdBackUrl: "",
  });

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.businessName.trim() || !form.emirate || !form.phone.trim()) {
      toast.error("Business name, emirate, and phone are required.");
      return;
    }
    if (!form.emiratesIdNumber.trim() || !form.emiratesIdFrontUrl || !form.emiratesIdBackUrl) {
      toast.error("Emirates ID number and both scans are required.");
      return;
    }
    if (!form.tradeLicense.trim() || !form.tradeLicenseDocUrl) {
      toast.error("Trade license number and document are required.");
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
        toast.success("Application submitted — we'll review it shortly.");
        router.refresh();
      } else {
        toast.error(data.error ?? "Could not submit application.");
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
          <p className="text-xs text-secondary">
            Business details + Emirates ID and trade license for verification.
          </p>
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

      <div className="mt-6 pt-5 border-t border-[#E7E4DA]">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-3.5 w-3.5 text-[#F0941F]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#141414]">
            Identity & license verification
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#141414] mb-1">
              Emirates ID number *
            </label>
            <input
              value={form.emiratesIdNumber}
              onChange={(e) => set("emiratesIdNumber")(e.target.value)}
              placeholder="784-XXXX-XXXXXXX-X"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#141414] mb-1">
              Trade license #
            </label>
            <input
              value={form.tradeLicense}
              onChange={(e) => set("tradeLicense")(e.target.value)}
              placeholder="e.g. DED-123456"
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
          <div className="sm:col-span-2">
            <DocUpload
              label="Trade license document"
              value={form.tradeLicenseDocUrl}
              onChange={set("tradeLicenseDocUrl")}
            />
          </div>
        </div>
      </div>

      <Button variant="gold" size="lg" className="mt-6 w-full" onClick={submit} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? "Submitting…" : "Submit application for review"}
      </Button>
      <p className="mt-3 text-[11px] text-muted text-center">
        Our team reviews every application before it goes live — usually within 1-2 business days.
      </p>
    </div>
  );
}
