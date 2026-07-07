"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { emirates } from "@/lib/brand";
import type { DealerProfile } from "@/lib/data/dealer-profile";
import { Loader2, BadgeCheck, Star } from "lucide-react";

const field =
  "w-full h-10 rounded-sm bg-white border border-[#E5E5E5] px-3 text-sm text-[#1A1A1A] placeholder:text-muted focus:outline-none focus:border-[#C8A93E]";
const labelCls = "text-[11px] uppercase tracking-wider text-muted mb-1.5 block";

export function ProfileForm({ profile }: { profile: DealerProfile }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    businessName: profile.businessName,
    tagline: profile.tagline,
    description: profile.description,
    emirate: profile.emirate,
    address: profile.address,
    phone: profile.phone,
    whatsapp: profile.whatsapp,
    website: profile.website,
    logoUrl: profile.logoUrl,
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/dealer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile saved");
      router.refresh();
    } catch {
      toast.error("Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
      {/* Editable fields */}
      <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-card p-5 space-y-4">
        <div>
          <label className={labelCls}>Business name</label>
          <input
            className={field}
            value={form.businessName}
            onChange={(e) => set("businessName", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Tagline</label>
          <input
            className={field}
            value={form.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            placeholder="Short one-line description"
          />
        </div>
        <div>
          <label className={labelCls}>About / description</label>
          <textarea
            className="w-full rounded-sm bg-white border border-[#E5E5E5] px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-muted focus:outline-none focus:border-[#C8A93E] min-h-[90px]"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Tell buyers about your dealership…"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Emirate</label>
            <select
              className={field}
              value={form.emirate}
              onChange={(e) => set("emirate", e.target.value)}
            >
              {emirates.map((e) => (
                <option key={e.id}>{e.en}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Website</label>
            <input
              className={field}
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://"
            />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input
              className={field}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+971 4 ..."
            />
          </div>
          <div>
            <label className={labelCls}>WhatsApp</label>
            <input
              className={field}
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="+971 5 ..."
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Address</label>
          <input
            className={field}
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Showroom address"
          />
        </div>
        <div>
          <label className={labelCls}>Logo URL</label>
          <input
            className={field}
            value={form.logoUrl}
            onChange={(e) => set("logoUrl", e.target.value)}
            placeholder="https://…/logo.png"
          />
        </div>

        <Button type="submit" variant="gold" size="md" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>

      {/* Read-only summary */}
      <div className="space-y-3">
        <div className="rounded-xl bg-bento-dark border border-[#C8A93E]/25 shadow-card p-5 grain">
          <div className="h-14 w-14 rounded-sm bg-gradient-to-br from-[#D8B84E] to-[#A98F2E] flex items-center justify-center text-white font-black">
            {form.businessName.charAt(0)}
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <h3 className="font-semibold text-sm">{form.businessName}</h3>
            {profile.isVerified && <BadgeCheck className="h-4 w-4 text-[#C8A93E]" />}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-secondary">
            <Star className="h-3 w-3 fill-[#C8A93E] text-[#C8A93E]" />
            {profile.rating} · {profile.reviewCount} reviews
          </div>
          <div className="mt-3">
            <Badge tone="featured">{profile.subscriptionTier.toUpperCase()}</Badge>
          </div>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-card p-4 text-[11px] text-muted">
          Your public storefront:{" "}
          <a
            href={`/dealers/${profile.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-[#A98F2E] hover:underline break-all"
          >
            /dealers/{profile.slug}
          </a>
        </div>
      </div>
    </form>
  );
}
