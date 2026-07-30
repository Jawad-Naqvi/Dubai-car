"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Building2, CheckCircle2, Globe } from "lucide-react";
import type { B2BBuyerView } from "@/lib/data/b2b";

export function B2BVerifications({ buyers }: { buyers: B2BBuyerView[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [verified, setVerified] = useState<Record<string, boolean>>({});

  const verify = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/b2b/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: true }),
      });
      if (!res.ok) throw new Error();
      setVerified((v) => ({ ...v, [id]: true }));
      toast.success("B2B buyer verified");
      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setBusy(null);
    }
  };

  const pending = buyers.filter((b) => !b.isVerified && !verified[b.id]);
  if (pending.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white shadow-card border border-[#E5E5EA] overflow-hidden">
      <div className="p-4 border-b border-[#E5E5EA]">
        <Eyebrow tone="emerald">B2B BUYER VERIFICATIONS</Eyebrow>
        <h2 className="mt-2 text-xs font-semibold text-[#141414]">{pending.length} awaiting approval</h2>
      </div>
      <div className="divide-y divide-[#E5E5EA]">
        {pending.map((b) => (
          <div
            key={b.id}
            className={`flex items-center gap-4 p-4 ${busy === b.id ? "opacity-50" : ""}`}
          >
            <div className="h-9 w-9 rounded-full bg-[#8136B2]/10 grid place-items-center flex-shrink-0">
              <Building2 className="h-4 w-4 text-[#8136B2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs truncate text-[#141414]">{b.companyName}</div>
              <div className="text-[11px] text-muted flex items-center gap-1">
                <Globe className="h-3 w-3" /> {b.country}
                {b.contactPhone ? ` · ${b.contactPhone}` : ""}
              </div>
            </div>
            <Badge tone="reserved">PENDING</Badge>
            <Button
              variant="emerald"
              size="sm"
              onClick={() => verify(b.id)}
              disabled={busy !== null}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verify
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
