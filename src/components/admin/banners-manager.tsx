"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import type { BannerView } from "@/lib/data/banners";
import { Plus, Trash2, ImageOff, Loader2 } from "lucide-react";

const field =
  "w-full h-10 rounded-xl bg-white border border-[#E5E5EA] px-3 text-sm text-[#141414] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[#141414]/20";
const labelCls = "text-[11px] uppercase tracking-wider text-muted mb-1.5 block";

const PLACEMENTS = ["homepage_hero", "homepage_strip", "category_top", "sidebar"];

export function BannersManager({ banners }: { banners: BannerView[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    placement: "homepage_hero",
    imageUrl: "",
    link: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Banner created");
      setOpen(false);
      setForm({ title: "", placement: "homepage_hero", imageUrl: "", link: "" });
      router.refresh();
    } catch {
      toast.error("Could not create banner");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (id: string, isActive: boolean) => {
    await fetch("/api/admin/banners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    router.refresh();
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/banners?id=${id}`, { method: "DELETE" });
    toast.success("Banner removed");
    router.refresh();
  };

  return (
    <main className="p-5 space-y-4">
      <div className="flex justify-end">
        <Button variant="gold" size="md" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24 rounded-2xl bg-white shadow-card border border-[#E5E5EA]">
          <ImageOff className="h-8 w-8 text-muted mb-3" />
          <h3 className="text-sm font-semibold text-[#141414]">No banners yet</h3>
          <p className="mt-1 text-xs text-muted">
            Create homepage or category ad placements to sell to dealers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {banners.map((b) => (
            <div key={b.id} className="rounded-2xl bg-white shadow-card border border-[#E5E5EA] overflow-hidden">
              <div className="relative aspect-[16/6] bg-[#F4F4F6]">
                {b.imageUrl && (
                  <Image src={b.imageUrl} alt={b.title} fill sizes="400px" className="object-cover" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-xs truncate text-[#141414]">{b.title}</div>
                    <div className="text-[10px] text-muted">{b.placement}</div>
                  </div>
                  <Badge tone={b.isActive ? "verified" : "neutral"}>
                    {b.isActive ? "ACTIVE" : "PAUSED"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggle(b.id, !b.isActive)}>
                    {b.isActive ? "Pause" : "Activate"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(b.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onOpenChange={setOpen} title="New banner">
        <form onSubmit={create} className="space-y-3">
          <div>
            <label className={labelCls}>Title</label>
            <input className={field} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Eid Mega Sale" />
          </div>
          <div>
            <label className={labelCls}>Placement</label>
            <select className={field} value={form.placement} onChange={(e) => set("placement", e.target.value)}>
              {PLACEMENTS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Image URL</label>
            <input className={field} value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <label className={labelCls}>Link (optional)</label>
            <input className={field} value={form.link} onChange={(e) => set("link", e.target.value)} placeholder="/buy?make=Toyota" />
          </div>
          <Button type="submit" variant="gold" size="md" className="w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Create banner
          </Button>
        </form>
      </Modal>
    </main>
  );
}
