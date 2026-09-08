"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Trash2, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

/**
 * The two rights the footer already claimed to honour, made real: download
 * everything we hold, and delete the account.
 *
 * Deletion asks the user to TYPE the word, not tick a box. It is irreversible
 * and it is the one control here that cannot be undone by support.
 */
export function PrivacyControls() {
  const [exporting, setExporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const download = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) throw new Error("Could not prepare your data.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Your data has been downloaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: confirmText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Your account has been deleted.");
      // Full sign-out clears the Clerk session too.
      window.location.href = "/";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deletion failed.");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#E5E5EA] bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="h-9 w-9 rounded-lg bg-[#F4F4F6] grid place-items-center flex-shrink-0">
            <Download className="h-4 w-4 text-[#8136B2]" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-[#141414]">
              Download your data
            </h3>
            <p className="mt-1 text-[11px] text-secondary leading-relaxed">
              Everything we hold about you — your account, listings, enquiries,
              messages, orders, shipments and saved cars — as a JSON file.
            </p>
          </div>
          <button
            type="button"
            onClick={download}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E5EA] text-[11px] font-semibold text-[#141414] hover:bg-[#F4F4F6] transition-colors flex-shrink-0 disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Download
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#DC2626]/25 bg-[#DC2626]/[0.03] p-4">
        <div className="flex items-start gap-3">
          <span className="h-9 w-9 rounded-lg bg-[#DC2626]/10 grid place-items-center flex-shrink-0">
            <Trash2 className="h-4 w-4 text-[#DC2626]" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-[#141414]">
              Delete your account
            </h3>
            <p className="mt-1 text-[11px] text-secondary leading-relaxed">
              Your identity documents are destroyed and your personal details
              removed. Records another party is entitled to keep — an order they
              fulfilled, a message they received — stay, with your details
              stripped out.
            </p>
          </div>
          {!confirmOpen && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#DC2626]/30 text-[11px] font-semibold text-[#DC2626] hover:bg-[#DC2626]/5 transition-colors flex-shrink-0"
            >
              Delete
            </button>
          )}
        </div>

        {confirmOpen && (
          <div className="mt-3 border-t border-[#DC2626]/20 pt-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[#DC2626] flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#DC2626] leading-relaxed">
                This cannot be undone. Type <strong>DELETE</strong> to confirm.
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                autoFocus
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                aria-label="Type DELETE to confirm"
                className="flex-1 h-9 rounded-lg border border-[#E5E5EA] px-2 text-xs outline-none focus:border-[#DC2626]"
              />
              <button
                type="button"
                onClick={remove}
                disabled={
                  deleting || confirmText.trim().toUpperCase() !== "DELETE"
                }
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#DC2626] text-white text-[11px] font-semibold disabled:opacity-40 flex-shrink-0"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Delete permanently"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmText("");
                }}
                className="h-9 px-3 rounded-lg text-[11px] font-semibold text-secondary hover:bg-[#F4F4F6] flex-shrink-0"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="flex items-start gap-1.5 text-[10px] text-muted leading-relaxed">
        <ShieldCheck className="h-3 w-3 flex-shrink-0 mt-0.5" />
        We cannot delete an account while a car is still being bought or
        shipped. Finish or cancel those first, or contact support.
      </p>
    </div>
  );
}
