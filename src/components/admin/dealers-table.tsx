"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { BadgeCheck, Search, FileText, IdCard, Loader2 } from "lucide-react";
import type { AdminDealer } from "@/lib/data/admin";

const TIER_TONE: Record<string, "featured" | "new" | "neutral"> = {
  platinum: "featured",
  gold: "new",
  silver: "neutral",
  free: "neutral",
};

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function DocLink({
  dealerId,
  field,
  label,
  available,
}: {
  dealerId: string;
  field: string;
  label: string;
  available: boolean;
}) {
  if (!available) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted">
        <FileText className="h-3.5 w-3.5" />
        {label} — not provided
      </span>
    );
  }
  return (
    <a
      href={`/api/kyc-doc/${dealerId}?field=${field}`}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 text-xs font-medium text-[#141414] underline underline-offset-2 hover:text-[#C97612]"
    >
      <FileText className="h-3.5 w-3.5 text-[#F0941F]" />
      View {label}
    </a>
  );
}

export function DealersTable({ dealers }: { dealers: AdminDealer[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<TabKey>("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminDealer | null>(null);
  const [reason, setReason] = useState("");

  const counts = useMemo(
    () => ({
      pending: dealers.filter((d) => d.kycStatus === "pending").length,
      approved: dealers.filter((d) => d.kycStatus === "approved").length,
      rejected: dealers.filter((d) => d.kycStatus === "rejected").length,
      all: dealers.length,
    }),
    [dealers],
  );

  const filtered = dealers
    .filter((d) => tab === "all" || d.kycStatus === tab)
    .filter((d) => !q || d.name.toLowerCase().includes(q.toLowerCase()));

  const approve = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/dealers/${id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Seller approved");
      router.refresh();
    } catch {
      toast.error("Approval failed");
    } finally {
      setBusy(null);
    }
  };

  const submitReject = async () => {
    if (!rejectTarget || !reason.trim()) return;
    setBusy(rejectTarget.id);
    try {
      const res = await fetch(`/api/admin/dealers/${rejectTarget.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success("Application rejected");
      setRejectTarget(null);
      setReason("");
      router.refresh();
    } catch {
      toast.error("Rejection failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="p-5 space-y-4">
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className="flex items-center gap-1.5">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`h-8 px-3 rounded-full text-xs font-semibold transition-colors ${
                tab === tb.key
                  ? "bg-[#141414] text-white"
                  : "bg-white border border-[#E7E4DA] text-secondary hover:bg-[#F3F1E9]"
              }`}
            >
              {tb.label} ({counts[tb.key]})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 h-9 w-72 rounded-xl bg-white border border-[#E7E4DA] px-4 text-xs focus-within:ring-2 focus-within:ring-[#141414]/20">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search dealer…"
            className="flex-1 bg-transparent outline-none text-[#141414] placeholder:text-muted"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-card border border-[#E7E4DA] divide-y divide-[#E7E4DA]">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-muted">No applications here.</div>
        )}
        {filtered.map((d) => (
          <div key={d.id} className={`p-4 ${busy === d.id ? "opacity-50" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href={`/dealers/${d.slug}`} className="flex items-center gap-3 group min-w-0">
                <div className="h-9 w-11 rounded-lg bg-[#141414] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {d.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-[#141414] flex items-center gap-1 group-hover:text-[#C97612] transition-colors">
                    {d.name}
                    {d.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-[#F0941F]" />}
                  </div>
                  <div className="text-xs text-muted">
                    {d.emirate} · <Badge tone={TIER_TONE[d.tier] ?? "neutral"}>{d.tier.toUpperCase()}</Badge>
                    {" · "}
                    {d.listingCount} listings
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0">
                {d.kycStatus === "pending" ? (
                  <Badge tone="reserved">PENDING REVIEW</Badge>
                ) : d.kycStatus === "approved" ? (
                  <Badge tone="verified">APPROVED</Badge>
                ) : (
                  <Badge tone="reserved">REJECTED</Badge>
                )}
                {d.kycStatus !== "approved" && (
                  <Button
                    variant="emerald"
                    size="sm"
                    onClick={() => approve(d.id)}
                    disabled={busy !== null}
                  >
                    {busy === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Approve"}
                  </Button>
                )}
                {d.kycStatus !== "rejected" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRejectTarget(d);
                      setReason("");
                    }}
                    disabled={busy !== null}
                  >
                    Reject
                  </Button>
                )}
              </div>
            </div>

            {(d.emiratesIdNumber || d.tradeLicense || d.hasEmiratesIdFront) && (
              <div className="mt-3 pt-3 border-t border-[#F1EFE9] flex flex-wrap items-center gap-x-5 gap-y-2">
                {d.emiratesIdNumber && (
                  <span className="flex items-center gap-1.5 text-xs text-secondary">
                    <IdCard className="h-3.5 w-3.5 text-muted" />
                    {d.emiratesIdNumber}
                  </span>
                )}
                <DocLink dealerId={d.id} field="emiratesIdFront" label="ID front" available={d.hasEmiratesIdFront} />
                <DocLink dealerId={d.id} field="emiratesIdBack" label="ID back" available={d.hasEmiratesIdBack} />
                <DocLink dealerId={d.id} field="tradeLicense" label="trade license" available={d.hasTradeLicenseDoc} />
                {d.kycStatus === "rejected" && d.kycRejectionReason && (
                  <span className="text-xs text-[#DC2626]">Reason: {d.kycRejectionReason}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={!!rejectTarget}
        onOpenChange={(v) => !v && setRejectTarget(null)}
        title={`Reject ${rejectTarget?.name ?? ""}`}
        description="This reason is emailed to the applicant so they know what to fix."
      >
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="e.g. Trade license document is unreadable — please re-upload a clearer scan."
          className="w-full rounded-xl bg-[#F3F1E9] border border-[#E7E4DA] px-3.5 py-2.5 text-sm text-[#141414] placeholder:text-muted focus:outline-none focus:border-[#141414]/30 focus:ring-2 focus:ring-[#141414]/10"
        />
        <Button
          variant="gold"
          size="lg"
          className="mt-4 w-full"
          onClick={submitReject}
          disabled={!reason.trim() || busy !== null}
        >
          {busy === rejectTarget?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send rejection"}
        </Button>
      </Modal>
    </main>
  );
}
