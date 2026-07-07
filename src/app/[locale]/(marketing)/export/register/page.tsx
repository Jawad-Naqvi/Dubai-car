"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RadialGlow } from "@/components/marketing/radial-glow";
import {
  Building2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Clock,
  Boxes,
} from "lucide-react";

const COUNTRIES = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "Tanzania",
  "South Africa",
  "Zambia",
  "Pakistan",
  "Uganda",
  "Other",
];

const field =
  "w-full h-11 rounded-sm bg-white border border-[#E5E5E5] px-3 text-sm text-[#1A1A1A] placeholder:text-muted focus:outline-none focus:border-[#C8A93E]";
const labelCls = "text-[11px] uppercase tracking-wider text-muted mb-1.5 block";

export default function B2BRegisterPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    country: "",
    contactName: "",
    contactPhone: "",
    email: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.country) {
      toast.error("Company name and country are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/b2b/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
      toast.success("Application submitted for verification.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="h-14 w-14 rounded-full bg-[#C8A93E]/10 border border-[#C8A93E]/30 grid place-items-center mx-auto">
          <CheckCircle2 className="h-7 w-7 text-[#C8A93E]" />
        </div>
        <h1 className="mt-5 text-xl font-bold tracking-tight">
          Application received
        </h1>
        <p className="mt-2 text-sm text-secondary">
          Our export team verifies B2B buyers within 24 hours. Once approved you
          can unlock yard contacts and request bulk quotes directly.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button asChild variant="gold" size="md">
            <Link href="/buy?exportReady=true">Browse export-ready stock</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className="relative py-12 overflow-hidden">
      <RadialGlow color="gold" size="xl" className="-top-40 -right-40 opacity-25" />
      <div className="relative mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 items-start">
          {/* Left: pitch */}
          <div>
            <Eyebrow tone="gold">B2B EXPORT BUYER</Eyebrow>
            <h1 className="mt-3 text-2xl font-bold tracking-tight leading-tight">
              Register to source UAE inventory at scale
            </h1>
            <p className="mt-3 text-sm text-secondary leading-relaxed">
              Verified importers get direct access to export-ready yards, bulk
              pricing, and documentation coordination.
            </p>
            <div className="mt-8 space-y-4">
              {[
                { icon: ShieldCheck, t: "Verified-only network", d: "Trade-licence verification keeps the marketplace serious." },
                { icon: Boxes, t: "Bulk deal management", d: "Select up to 50 vehicles per order with one inquiry." },
                { icon: Clock, t: "24-hour approval", d: "Most applications are reviewed within a business day." },
              ].map((x) => (
                <div key={x.t} className="flex gap-3">
                  <x.icon className="h-5 w-5 text-[#C8A93E] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold">{x.t}</div>
                    <div className="text-xs text-muted">{x.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <form
            onSubmit={submit}
            className="rounded-xl bg-white border border-[#E5E5E5] shadow-card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-4 w-4 text-[#C8A93E]" />
              <span className="text-sm font-semibold">Company details</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Company name *</label>
                <input
                  className={field}
                  value={form.companyName}
                  onChange={(e) => set("companyName", e.target.value)}
                  placeholder="e.g. Lagos Auto Imports Ltd."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Destination country *</label>
                  <select
                    className={field}
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                  >
                    <option value="">Select</option>
                    {COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Contact name</label>
                  <input
                    className={field}
                    value={form.contactName}
                    onChange={(e) => set("contactName", e.target.value)}
                    placeholder="Full name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Phone / WhatsApp</label>
                  <input
                    className={field}
                    value={form.contactPhone}
                    onChange={(e) => set("contactPhone", e.target.value)}
                    placeholder="+234…"
                  />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    className={field}
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="ops@company.com"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Trade licence</label>
                <div className="rounded-sm border border-dashed border-[#E5E5E5] bg-[#F4F4F4] p-4 text-center text-xs text-muted">
                  Upload available after verification call. Submit the form to
                  start.
                </div>
              </div>
            </div>
            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full mt-5"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit for verification
            </Button>
            <p className="mt-3 text-[10px] text-muted text-center">
              By registering you agree to our B2B terms. We verify all importers.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
