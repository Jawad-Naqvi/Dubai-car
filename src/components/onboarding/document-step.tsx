"use client";

import { useRef, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import {
  Upload,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
} from "lucide-react";

/**
 * Onboarding step two: the documents this country and party type require.
 *
 * The list is rendered from the server's requirement pack, not hardcoded, so
 * the same component asks a UAE dealer for an Emirates ID and trade licence
 * and would ask a German one for a Personalausweis without a code change.
 *
 * SKIPPING IS ALWAYS ALLOWED. "Add later" is a first-class button, and the
 * account remains usable in a clearly-marked pending state instead of trapping
 * someone who doesn't have a scan to hand right now.
 */

export interface RequirementItem {
  id: string;
  docType: string;
  label: string;
  helpText: string | null;
  required: boolean;
  twoSided: boolean;
}

export interface SubmittedMap {
  [docType: string]: { status: string; rejectionReason: string | null };
}

export function DocumentStep({
  orgId,
  requirements,
  submitted: initialSubmitted,
  continueHref,
}: {
  orgId: string;
  requirements: RequirementItem[];
  submitted: SubmittedMap;
  continueHref: string;
}) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState<SubmittedMap>(initialSubmitted);
  const [busyType, setBusyType] = useState<string | null>(null);

  const outstanding = requirements.filter(
    (r) => r.required && !submitted[r.docType],
  );

  const upload = async (req: RequirementItem, files: FileList | null) => {
    if (!files?.length) return;
    setBusyType(req.docType);
    try {
      const form = new FormData();
      for (const f of Array.from(files).slice(0, 2)) form.append("files", f);

      const up = await fetch("/api/upload-doc", { method: "POST", body: form });
      const upData = await up.json();
      if (!up.ok) throw new Error(upData.error ?? "Upload failed.");

      // /api/media/<uuid> — keep the id, the route resolves access on read.
      const ids: string[] = (upData.urls ?? []).map((u: string) =>
        u.split("/").pop(),
      );

      const res = await fetch("/api/onboarding/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          docType: req.docType,
          frontMediaId: ids[0],
          backMediaId: req.twoSided ? ids[1] : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSubmitted((prev) => ({
        ...prev,
        [req.docType]: { status: "pending", rejectionReason: null },
      }));
      toast.success(`${req.label} uploaded.`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not upload.");
    } finally {
      setBusyType(null);
    }
  };

  return (
    <div className="space-y-3">
      {requirements.map((req) => (
        <DocumentRow
          key={req.id}
          req={req}
          state={submitted[req.docType]}
          busy={busyType === req.docType}
          onFiles={(files) => upload(req, files)}
        />
      ))}

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <a
          href={continueHref}
          className="inline-flex items-center justify-center gap-2 h-10 flex-1 rounded-lg bg-[#8136B2] text-white text-xs font-semibold hover:bg-[#370B55] transition-colors"
        >
          {outstanding.length === 0 ? "Continue" : "Continue for now"}
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      {outstanding.length > 0 && (
        <p className="text-[11px] text-muted text-center leading-relaxed">
          You can add {outstanding.length === 1 ? "this" : "these"} later from
          your dashboard. Until {outstanding.length === 1 ? "it is" : "they are"}{" "}
          verified your listings stay in review.
        </p>
      )}
    </div>
  );
}

function DocumentRow({
  req,
  state,
  busy,
  onFiles,
}: {
  req: RequirementItem;
  state?: { status: string; rejectionReason: string | null };
  busy: boolean;
  onFiles: (files: FileList | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const status = state?.status;

  return (
    <div className="rounded-xl border border-[#E5E5EA] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-[#141414]">{req.label}</h3>
            {!req.required && (
              <span className="rounded-full bg-[#F4F4F6] px-2 py-0.5 text-[10px] font-medium text-[#63666A]">
                Optional
              </span>
            )}
            <StatusChip status={status} />
          </div>
          {req.helpText && (
            <p className="mt-1 text-[11px] text-secondary leading-relaxed">
              {req.helpText}
            </p>
          )}
          {status === "rejected" && state?.rejectionReason && (
            <p className="mt-1.5 text-[11px] text-[#DC2626]">
              {state.rejectionReason}
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E5EA] text-[11px] font-semibold text-[#141414] hover:bg-[#F4F4F6] transition-colors flex-shrink-0 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {status ? "Replace" : "Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          multiple={req.twoSided}
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>
      {req.twoSided && !status && (
        <p className="mt-2 text-[10px] text-muted">
          Select both sides at once (front and back).
        </p>
      )}
    </div>
  );
}

function StatusChip({ status }: { status?: string }) {
  if (!status) return null;
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#137A43]/12 px-2 py-0.5 text-[10px] font-semibold text-[#137A43]">
        <CheckCircle2 className="h-2.5 w-2.5" /> Verified
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#DC2626]/10 px-2 py-0.5 text-[10px] font-semibold text-[#DC2626]">
        <XCircle className="h-2.5 w-2.5" /> Needs changes
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#B7791F]/12 px-2 py-0.5 text-[10px] font-semibold text-[#8A5A12]">
      <Clock className="h-2.5 w-2.5" /> In review
    </span>
  );
}
