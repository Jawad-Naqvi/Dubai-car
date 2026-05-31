"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Search } from "lucide-react";
import type { AdminDealer } from "@/lib/data/admin";

const TIER_TONE: Record<string, "featured" | "new" | "neutral"> = {
  platinum: "featured",
  gold: "new",
  silver: "neutral",
  free: "neutral",
};

export function DealersTable({ dealers }: { dealers: AdminDealer[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [verified, setVerified] = useState<Record<string, boolean>>({});

  const filtered = dealers.filter(
    (d) => !q || d.name.toLowerCase().includes(q.toLowerCase()),
  );

  const toggle = async (id: string, next: boolean) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/dealers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: next }),
      });
      if (!res.ok) throw new Error();
      setVerified((v) => ({ ...v, [id]: next }));
      toast.success(next ? "Dealer verified" : "Verification removed");
      router.refresh();
    } catch {
      toast.error("Update failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 h-8 w-80 rounded-sm bg-[#161616] border border-white/10 px-4 text-xs">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search dealer…"
            className="flex-1 bg-transparent outline-none text-white placeholder:text-muted"
          />
        </div>
      </div>

      <div className="rounded bg-[#161616] border border-white/8 overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-[#121212] text-[10px] uppercase tracking-widest text-muted">
            <tr>
              <th className="text-start p-4 font-medium">Dealer</th>
              <th className="text-start p-4 font-medium hidden md:table-cell">Emirate</th>
              <th className="text-start p-4 font-medium">Plan</th>
              <th className="text-start p-4 font-medium hidden lg:table-cell">Listings</th>
              <th className="text-start p-4 font-medium hidden lg:table-cell">Rating</th>
              <th className="text-start p-4 font-medium">Status</th>
              <th className="text-start p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              const isVerified = verified[d.id] ?? d.isVerified;
              return (
                <tr key={d.id} className={`border-t border-white/5 hover:bg-white/[0.02] ${busy === d.id ? "opacity-50" : ""}`}>
                  <td className="p-4">
                    <Link href={`/dealers/${d.slug}`} className="flex items-center gap-3 group">
                      <div className="h-8 w-10 rounded-sm bg-gradient-to-br from-[#F0CE5C] via-[#D4AF37] to-[#8C7220] flex items-center justify-center text-[#1A1208] font-bold text-xs">
                        {d.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs flex items-center gap-1 group-hover:text-[#F0CE5C] transition-colors">
                          {d.name}
                          {isVerified && <BadgeCheck className="h-3.5 w-3.5 text-[#F0CE5C]" />}
                        </div>
                        <div className="text-xs text-muted">{d.id.slice(0, 8)}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="p-4 hidden md:table-cell text-xs text-secondary">{d.emirate}</td>
                  <td className="p-4">
                    <Badge tone={TIER_TONE[d.tier] ?? "neutral"}>{d.tier.toUpperCase()}</Badge>
                  </td>
                  <td className="p-4 hidden lg:table-cell text-xs">{d.listingCount}</td>
                  <td className="p-4 hidden lg:table-cell text-xs">{d.rating} ★</td>
                  <td className="p-4">
                    {isVerified ? (
                      <Badge tone="verified">VERIFIED</Badge>
                    ) : (
                      <Badge tone="reserved">PENDING</Badge>
                    )}
                  </td>
                  <td className="p-4">
                    <Button
                      variant={isVerified ? "ghost" : "emerald"}
                      size="sm"
                      onClick={() => toggle(d.id, !isVerified)}
                      disabled={busy !== null}
                    >
                      {isVerified ? "Unverify" : "Verify"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
