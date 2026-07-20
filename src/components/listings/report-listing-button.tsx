"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Flag, Loader2 } from "lucide-react";

const REASONS = [
  "Scam or fraud",
  "Wrong or misleading info",
  "Already sold",
  "Duplicate listing",
  "Offensive content",
  "Other",
];

/** Fraud/scam reporting — files a listing_report the admin queue can action. */
export function ReportListingButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details, email }),
      });
      if (!res.ok) throw new Error();
      toast.success("Report submitted", {
        description: "Thanks — our team will review this listing.",
      });
      setOpen(false);
      setDetails("");
    } catch {
      toast.error("Could not submit report. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-[10px] text-muted hover:text-[#CE2A2A] transition-colors"
      >
        <Flag className="h-2.5 w-2.5" />
        Report this listing
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <form
            onSubmit={submit}
            className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl border border-[#E7E4DA] p-5 space-y-3"
          >
            <h3 className="text-base font-bold">Report listing</h3>
            <div>
              <label className="text-[11px] text-secondary">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full h-9 rounded-lg border border-[#E5E5E5] px-2 text-sm focus:outline-none focus:border-[#C8A93E]"
              >
                {REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="What's wrong with this listing? (optional)"
              rows={3}
              maxLength={2000}
              className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm focus:outline-none focus:border-[#C8A93E] resize-none"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Your email (optional)"
              className="w-full h-9 rounded-lg border border-[#E5E5E5] px-3 text-sm focus:outline-none focus:border-[#C8A93E]"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 h-9 rounded-lg border border-[#E5E5E5] text-xs font-semibold hover:bg-[#F3F1E9]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 h-9 rounded-lg bg-[#CE2A2A] text-white text-xs font-semibold hover:bg-[#B62525] disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Submit report"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
