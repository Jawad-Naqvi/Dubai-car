"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Check, X, Building2 } from "lucide-react";

/**
 * Verification queue. Approving here is what flips an organization to
 * "active" — the state that lets a dealer publish listings and lets a freight
 * partner start receiving shipping requests.
 *
 * A rejection requires a reason. Sending someone away without telling them
 * what to fix just produces a support ticket.
 */

interface OrgRow {
  id: string;
  name: string;
  type: string;
  countryCode: string;
  submittedAt: string | null;
}

export function OrgReviewList({ orgs }: { orgs: OrgRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const decide = async (
    id: string,
    status: "active" | "rejected",
    rejectionReason?: string,
  ) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/orgs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(status === "active" ? "Verified." : "Sent back for changes.");
      setRejecting(null);
      setReason("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-xl border border-[#E5E5EA] bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#E5E5EA] px-4 py-3">
        <ShieldCheck className="h-4 w-4 text-[#8136B2]" />
        <div>
          <h3 className="text-xs font-bold text-[#141414]">
            Awaiting verification
          </h3>
          <p className="text-[11px] text-muted">
            {orgs.length} organization{orgs.length === 1 ? "" : "s"} in the queue.
          </p>
        </div>
      </div>

      {orgs.length === 0 ? (
        <p className="px-4 py-6 text-center text-[11px] text-muted">
          Nothing waiting. Everyone is verified.
        </p>
      ) : (
        <ul className="divide-y divide-[#E5E5EA]">
          {orgs.map((org) => (
            <li key={org.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex items-start gap-2.5">
                  <span className="h-8 w-8 rounded-lg bg-[#F4F4F6] grid place-items-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-[#8136B2]" />
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-semibold text-[#141414] truncate">
                      {org.name}
                    </h4>
                    <p className="text-[10px] text-muted">
                      {org.type} · {org.countryCode}
                      {org.submittedAt
                        ? ` · submitted ${new Date(org.submittedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => decide(org.id, "active")}
                    disabled={busyId === org.id}
                    className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-[#137A43] text-white text-[10px] font-semibold hover:bg-[#0F6236] transition-colors disabled:opacity-50"
                  >
                    {busyId === org.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-3 w-3" /> Verify
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRejecting(rejecting === org.id ? null : org.id)
                    }
                    className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-[#E5E5EA] text-[10px] font-semibold text-[#141414] hover:bg-[#F4F4F6] transition-colors"
                  >
                    <X className="h-3 w-3" /> Changes
                  </button>
                </div>
              </div>

              {rejecting === org.id && (
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    autoFocus
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="What needs fixing? They'll see this."
                    className="flex-1 h-8 rounded-lg border border-[#E5E5EA] px-2 text-[11px] outline-none focus:border-[#8136B2]"
                  />
                  <button
                    type="button"
                    onClick={() => decide(org.id, "rejected", reason.trim())}
                    disabled={!reason.trim() || busyId === org.id}
                    className="h-8 px-3 rounded-lg bg-[#141414] text-white text-[10px] font-semibold disabled:opacity-50 flex-shrink-0"
                  >
                    Send back
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
