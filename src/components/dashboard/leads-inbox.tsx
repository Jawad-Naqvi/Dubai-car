"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatAED } from "@/lib/utils";
import type { LeadView } from "@/lib/data/leads";
import {
  MessageCircle,
  Phone,
  Mail,
  Ship,
  ChevronDown,
  Check,
} from "lucide-react";

const TABS = ["All", "New", "Responded", "Won", "Lost", "Export"] as const;

const TYPE_META: Record<string, { label: string; icon: typeof MessageCircle }> = {
  inquiry: { label: "Message", icon: Mail },
  contact_unlock: { label: "Contact unlock", icon: Phone },
  test_drive: { label: "Test drive", icon: MessageCircle },
  export_inquiry: { label: "Export", icon: Ship },
};

const STATUS_OPTIONS = ["new", "responded", "won", "lost"];

function statusBadge(s: string) {
  switch (s) {
    case "new":
      return <Badge tone="new">NEW</Badge>;
    case "responded":
      return <Badge tone="verified">RESPONDED</Badge>;
    case "won":
      return <Badge tone="featured">WON</Badge>;
    case "lost":
      return <Badge tone="neutral">LOST</Badge>;
    default:
      return <Badge tone="reserved">{s.toUpperCase()}</Badge>;
  }
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function LeadsInbox({ leads }: { leads: LeadView[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = leads.filter((l) => {
    if (tab === "All") return true;
    if (tab === "Export") return l.type === "export_inquiry";
    return l.status === tab.toLowerCase();
  });

  const counts = {
    All: leads.length,
    New: leads.filter((l) => l.status === "new").length,
    Responded: leads.filter((l) => l.status === "responded").length,
    Won: leads.filter((l) => l.status === "won").length,
    Lost: leads.filter((l) => l.status === "lost").length,
    Export: leads.filter((l) => l.type === "export_inquiry").length,
  };

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Marked ${status}`);
      router.refresh();
    } catch {
      toast.error("Update failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="p-5 space-y-4">
      <div className="flex items-center gap-1 border-b border-[#E5E5E5] overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              t === tab
                ? "px-4 py-3 text-xs font-semibold border-b-2 border-[#C8A93E] text-[#A98F2E] whitespace-nowrap"
                : "px-4 py-3 text-xs text-secondary hover:text-[#1A1A1A] border-b-2 border-transparent whitespace-nowrap"
            }
          >
            {t}
            <span className="ms-2 text-xs text-muted">({counts[t]})</span>
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-muted">
            No leads in this view yet.
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E5]">
            {filtered.map((l) => {
              const meta = TYPE_META[l.type] ?? TYPE_META.inquiry;
              const Icon = meta.icon;
              return (
                <div
                  key={l.id}
                  className={`grid grid-cols-1 md:grid-cols-[1.4fr_1.4fr_130px_110px_130px] items-center gap-4 p-5 hover:bg-[#F8F8F8] ${
                    busy === l.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-10 rounded-full bg-[#C8A93E]/10 text-[#A98F2E] flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {l.buyerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs truncate">{l.buyerName}</div>
                      <div className="text-xs text-muted truncate">
                        {l.id} · {timeAgo(l.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-secondary truncate">
                      {l.message || (l.destinationCountry ? `Export → ${l.destinationCountry}` : "—")}
                    </div>
                    <div className="text-[10px] text-muted truncate mt-0.5">
                      {l.buyerPhone || l.buyerEmail}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-secondary">
                    <Icon className="h-3.5 w-3.5" />
                    {meta.label}
                  </div>
                  <div className="text-xs font-semibold text-[#C8A93E]">
                    {l.feeAED ? formatAED(l.feeAED) : "—"}
                  </div>
                  <Dropdown.Root>
                    <Dropdown.Trigger asChild>
                      <button className="inline-flex items-center gap-1">
                        {statusBadge(l.status)}
                        <ChevronDown className="h-3 w-3 text-muted" />
                      </button>
                    </Dropdown.Trigger>
                    <Dropdown.Portal>
                      <Dropdown.Content
                        align="end"
                        className="z-50 min-w-[140px] rounded-md bg-white border border-[#E5E5E5] p-1 shadow-card text-xs"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <Dropdown.Item
                            key={s}
                            onClick={() => setStatus(l.id, s)}
                            className="flex items-center justify-between px-2.5 py-2 rounded-sm cursor-pointer outline-none text-secondary data-[highlighted]:bg-[#F8F8F8] capitalize"
                          >
                            {s}
                            {l.status === s && <Check className="h-3 w-3 text-[#C8A93E]" />}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Content>
                    </Dropdown.Portal>
                  </Dropdown.Root>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
