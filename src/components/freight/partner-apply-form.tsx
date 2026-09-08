"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, CheckCircle2 } from "lucide-react";

interface CountryOption {
  code: string;
  name: string;
}

/**
 * Freight forwarder application. Submitting creates a record for review — it
 * does not create an account, and deliberately cannot: the account only exists
 * once an admin sends an invitation.
 */
export function PartnerApplyForm({ countries }: { countries: CountryOption[] }) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    countryCode: "AE",
    website: "",
    message: "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.companyName.trim() || !form.contactName.trim() || !form.email.trim()) {
      toast.error("Company, contact name and email are required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send application.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-[#E5E5EA] bg-white p-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-[#137A43] mx-auto" />
        <h2 className="mt-3 text-sm font-bold text-[#141414]">
          Application received
        </h2>
        <p className="mt-1.5 text-xs text-secondary leading-relaxed max-w-xs mx-auto">
          We&apos;ll review your licences and lanes, then email{" "}
          <span className="font-semibold text-[#141414]">{form.email}</span>{" "}
          with an onboarding link. This usually takes 1–2 business days.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E5E5EA] bg-white p-6">
      <h2 className="text-sm font-bold text-[#141414]">
        Apply to join
      </h2>
      <p className="mt-0.5 text-[11px] text-muted">
        Tell us about your company and the routes you run.
      </p>

      <div className="mt-4 space-y-3">
        <Field
          label="Company name"
          value={form.companyName}
          onChange={(v) => set("companyName", v)}
          placeholder="Registered name on your trade licence"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Your name"
            value={form.contactName}
            onChange={(v) => set("contactName", v)}
            placeholder="Full name"
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => set("email", v)}
            placeholder="you@company.com"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Phone"
            value={form.phone}
            onChange={(v) => set("phone", v)}
            placeholder="+971 …"
            optional
          />
          <label className="block">
            <span className="text-[11px] font-semibold text-[#141414]">
              Based in
            </span>
            <select
              value={form.countryCode}
              onChange={(e) => set("countryCode", e.target.value)}
              className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] px-2 text-xs outline-none focus:border-[#8136B2] bg-white"
            >
              <option value="AE">United Arab Emirates</option>
              {countries
                .filter((c) => c.code !== "AE")
                .map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <Field
          label="Website"
          value={form.website}
          onChange={(v) => set("website", v)}
          placeholder="https://"
          optional
        />
        <label className="block">
          <span className="text-[11px] font-semibold text-[#141414]">
            Lanes you serve and licences you hold
          </span>
          <textarea
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            rows={4}
            placeholder="e.g. Jebel Ali to Mombasa, Dar es Salaam and Lagos. RO-RO and consolidated containers. Dubai Customs broker code held."
            className="mt-1 w-full rounded-lg border border-[#E5E5EA] px-2 py-2 text-xs outline-none focus:border-[#8136B2] resize-none"
          />
        </label>

        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 h-10 w-full rounded-lg bg-[#8136B2] text-white text-xs font-semibold hover:bg-[#370B55] transition-colors disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              Send application
            </>
          )}
        </button>
        <p className="text-[10px] text-muted text-center leading-relaxed">
          We review every application. You&apos;ll get an onboarding link by
          email if we&apos;re a fit.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  optional?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-[#141414]">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] px-2 text-xs outline-none focus:border-[#8136B2]"
      />
    </label>
  );
}
