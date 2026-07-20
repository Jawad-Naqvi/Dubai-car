"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Flag, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  listingId: string;
  listingTitle: string;
  reason: string;
  details: string;
  reporterEmail: string;
  status: string;
  createdAt: string;
}

const STATUS_STYLE: Record<string, string> = {
  open: "bg-[#FBE7D4] text-[#C97612]",
  reviewing: "bg-[#E7EEF6] text-[#2456C7]",
  resolved: "bg-[#E7F1EA] text-[#137A43]",
  dismissed: "bg-[#F3F1E9] text-[#6B6B6B]",
};

export function ReportsQueue({ initial }: { initial: Report[] }) {
  const [reports, setReports] = useState<Report[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (id: string, status: string) => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      setReports(data.reports ?? []);
      toast.success(`Marked ${status}`);
    } catch {
      toast.error("Could not update report");
    } finally {
      setBusy(null);
    }
  };

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-6 text-center text-muted text-sm">
        <Flag className="h-5 w-5 mx-auto mb-2 text-[#B8B2A0]" />
        No reports. The queue is clear.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reports.map((r) => (
        <div
          key={r.id}
          className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{r.reason}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                    STATUS_STYLE[r.status] ?? STATUS_STYLE.open,
                  )}
                >
                  {r.status}
                </span>
              </div>
              <Link
                href={`/listings/${r.listingId}`}
                className="mt-1 inline-flex items-center gap-1 text-xs text-secondary hover:text-[#141414]"
              >
                {r.listingTitle}
                <ExternalLink className="h-2.5 w-2.5" />
              </Link>
              {r.details && (
                <p className="mt-1.5 text-xs text-secondary leading-relaxed">
                  {r.details}
                </p>
              )}
              <p className="mt-1 text-[10px] text-muted">
                {r.reporterEmail || "anonymous"} ·{" "}
                {new Date(r.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              {["reviewing", "resolved", "dismissed"].map((s) => (
                <button
                  key={s}
                  disabled={busy === r.id || r.status === s}
                  onClick={() => act(r.id, s)}
                  className="text-[10px] px-2 py-1 rounded-md border border-[#E5E5E5] capitalize hover:bg-[#F3F1E9] disabled:opacity-40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
