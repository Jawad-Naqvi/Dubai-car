"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAED, formatKm } from "@/lib/utils";
import type { InventoryRow } from "@/lib/data/dashboard";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  MessageCircle,
  CheckCircle2,
  Tag,
  Archive,
  Star,
  Trash2,
  Clock,
} from "lucide-react";

const TABS = ["All", "Active", "Pending", "Reserved", "Sold", "Archived"] as const;

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge tone="verified">ACTIVE</Badge>;
    case "pending_review":
      return <Badge tone="new">PENDING</Badge>;
    case "reserved":
      return <Badge tone="reserved">RESERVED</Badge>;
    case "sold":
      return <Badge tone="featured">SOLD</Badge>;
    case "rejected":
      return <Badge tone="neutral">REJECTED</Badge>;
    default:
      return <Badge tone="neutral">{status.toUpperCase()}</Badge>;
  }
}

export function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: rows.length };
    for (const r of rows) {
      const key =
        r.status === "pending_review"
          ? "Pending"
          : r.status.charAt(0).toUpperCase() + r.status.slice(1);
      c[key] = (c[key] ?? 0) + 1;
    }
    return c;
  }, [rows]);

  const filtered = rows.filter((r) => {
    if (tab !== "All") {
      const key =
        r.status === "pending_review"
          ? "Pending"
          : r.status.charAt(0).toUpperCase() + r.status.slice(1);
      if (key !== tab) return false;
    }
    if (q && !r.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const act = async (
    id: string,
    patch: { status?: string; isFeatured?: boolean },
    label: string,
  ) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error();
      toast.success(label);
      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Listing deleted");
      router.refresh();
    } catch {
      toast.error("Delete failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="p-5 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 h-8 w-72 rounded-sm bg-[#161616] border border-white/10 px-4 text-xs text-muted">
          <Search className="h-4 w-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search make, model…"
            className="flex-1 bg-transparent outline-none text-white placeholder:text-muted"
          />
        </div>
        <Button variant="gold" size="md" asChild>
          <Link href="/sell/new">
            <Plus className="h-4 w-4" /> Add listing
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              t === tab
                ? "px-4 py-3 text-xs font-semibold border-b-2 border-[#F0CE5C] text-[#F0CE5C] whitespace-nowrap"
                : "px-4 py-3 text-xs text-secondary hover:text-white border-b-2 border-transparent whitespace-nowrap"
            }
          >
            {t}
            <span className="ms-2 text-xs text-muted">({counts[t] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded bg-[#161616] border border-white/8 overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-[#121212] text-[10px] uppercase tracking-widest text-muted">
            <tr>
              <th className="text-start p-4 font-medium">Vehicle</th>
              <th className="text-start p-4 font-medium">Price</th>
              <th className="text-start p-4 font-medium hidden md:table-cell">Year · KM</th>
              <th className="text-start p-4 font-medium">Status</th>
              <th className="text-start p-4 font-medium hidden lg:table-cell">Views</th>
              <th className="text-start p-4 font-medium hidden lg:table-cell">Leads</th>
              <th className="text-start p-4 font-medium w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-xs text-muted">
                  No listings in this view.
                </td>
              </tr>
            )}
            {filtered.map((l) => (
              <tr
                key={l.id}
                className={`border-t border-white/5 hover:bg-white/[0.02] ${
                  busy === l.id ? "opacity-50" : ""
                }`}
              >
                <td className="p-4">
                  <Link
                    href={`/listings/${l.id}/${l.slug}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="relative h-12 w-16 rounded-sm overflow-hidden bg-[#121212] flex-shrink-0">
                      <Image src={l.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs truncate group-hover:text-[#F0CE5C] transition-colors flex items-center gap-1">
                        {l.title}
                        {l.isFeatured && <Star className="h-3 w-3 text-[#F0CE5C] fill-[#F0CE5C]" />}
                      </div>
                      <div className="text-xs text-muted">DXB-{l.id}</div>
                    </div>
                  </Link>
                </td>
                <td className="p-4 font-bold text-gradient-gold">{formatAED(l.priceAED)}</td>
                <td className="p-4 hidden md:table-cell text-xs text-secondary">
                  {l.year} · {formatKm(l.kms)}
                </td>
                <td className="p-4">{statusBadge(l.status)}</td>
                <td className="p-4 hidden lg:table-cell">
                  <div className="flex items-center gap-1 text-xs">
                    <Eye className="h-3 w-3 text-muted" />
                    {l.viewCount.toLocaleString()}
                  </div>
                </td>
                <td className="p-4 hidden lg:table-cell">
                  <div className="flex items-center gap-1 text-xs">
                    <MessageCircle className="h-3 w-3 text-muted" />
                    {l.inquiryCount}
                  </div>
                </td>
                <td className="p-4">
                  <Dropdown.Root>
                    <Dropdown.Trigger asChild>
                      <button className="h-8 w-8 rounded-sm hover:bg-white/5 flex items-center justify-center">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </Dropdown.Trigger>
                    <Dropdown.Portal>
                      <Dropdown.Content
                        align="end"
                        className="z-50 min-w-[170px] rounded-md bg-[#161616] border border-white/10 p-1 shadow-xl text-xs"
                      >
                        <Item onClick={() => act(l.id, { status: "active" }, "Marked active")}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark active
                        </Item>
                        <Item onClick={() => act(l.id, { status: "reserved" }, "Marked reserved")}>
                          <Clock className="h-3.5 w-3.5" /> Mark reserved
                        </Item>
                        <Item onClick={() => act(l.id, { status: "sold" }, "Marked sold")}>
                          <Tag className="h-3.5 w-3.5" /> Mark sold
                        </Item>
                        <Item
                          onClick={() =>
                            act(l.id, { isFeatured: !l.isFeatured }, l.isFeatured ? "Unfeatured" : "Featured")
                          }
                        >
                          <Star className="h-3.5 w-3.5" /> {l.isFeatured ? "Unfeature" : "Feature"}
                        </Item>
                        <Item onClick={() => act(l.id, { status: "archived" }, "Archived")}>
                          <Archive className="h-3.5 w-3.5" /> Archive
                        </Item>
                        <Dropdown.Separator className="my-1 h-px bg-white/5" />
                        <Item danger onClick={() => remove(l.id)}>
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Item>
                      </Dropdown.Content>
                    </Dropdown.Portal>
                  </Dropdown.Root>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Item({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <Dropdown.Item
      onClick={onClick}
      className={`flex items-center gap-2 px-2.5 py-2 rounded-sm cursor-pointer outline-none data-[highlighted]:bg-white/5 ${
        danger ? "text-[#EF4444]" : "text-secondary"
      }`}
    >
      {children}
    </Dropdown.Item>
  );
}
