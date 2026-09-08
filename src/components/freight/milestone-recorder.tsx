"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import {
  milestonesForMode,
  milestoneLabel,
  type MilestoneKey,
} from "@/lib/freight/milestones";
import { Loader2, Plus } from "lucide-react";

/**
 * The forwarder's data-entry panel.
 *
 * Most of these steps cannot be automated. Container shipments can be tracked
 * by carrier APIs off the container number, but RO-RO — the cheaper and more
 * common option for a running car — has no container and therefore no feed at
 * all. Origin-side steps (collection, de-registration, customs filing) are
 * never machine-readable either. So the forwarder keys them in, and every
 * event records its source so nobody mistakes a typed date for a carrier fact.
 */
export function MilestoneRecorder({
  shipmentId,
  mode,
  originCountry,
}: {
  shipmentId: string;
  mode: string;
  originCountry: string;
}) {
  const router = useRouter();
  const steps = milestonesForMode(mode);

  const [milestone, setMilestone] = useState<MilestoneKey | "">(
    steps[0]?.key ?? "",
  );
  const [classifier, setClassifier] = useState<"ACT" | "EST">("ACT");
  const [eventAt, setEventAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!milestone) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/freight/shipments/${shipmentId}/milestones`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            milestone,
            classifier,
            eventAt: new Date(eventAt).toISOString(),
            location: location.trim() || undefined,
            note: note.trim() || undefined,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        classifier === "ACT"
          ? "Milestone recorded — everyone on this shipment can see it."
          : "Estimate updated.",
      );
      setLocation("");
      setNote("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#E5E5EA] bg-white p-4">
      <h3 className="text-xs font-bold text-[#141414]">Record an update</h3>
      <p className="mt-0.5 text-[11px] text-muted">
        Posts to the shared timeline and notifies the buyer and seller.
      </p>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block sm:col-span-2">
          <span className="text-[11px] font-semibold text-[#141414]">Step</span>
          <select
            value={milestone}
            onChange={(e) => setMilestone(e.target.value as MilestoneKey)}
            className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] px-2 text-xs outline-none focus:border-[#8136B2] bg-white"
          >
            {steps.map((s) => (
              <option key={s.key} value={s.key}>
                {milestoneLabel(s.key, originCountry)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-[#141414]">
            This is
          </span>
          <select
            value={classifier}
            onChange={(e) => setClassifier(e.target.value as "ACT" | "EST")}
            className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] px-2 text-xs outline-none focus:border-[#8136B2] bg-white"
          >
            <option value="ACT">Confirmed — it happened</option>
            <option value="EST">Estimated — expected date</option>
          </select>
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-[#141414]">Date</span>
          <input
            type="date"
            value={eventAt}
            onChange={(e) => setEventAt(e.target.value)}
            className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] px-2 text-xs outline-none focus:border-[#8136B2]"
          />
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-[#141414]">
            Location <span className="font-normal text-muted">(optional)</span>
          </span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Jebel Ali Terminal 2"
            className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] px-2 text-xs outline-none focus:border-[#8136B2]"
          />
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-[#141414]">
            Note <span className="font-normal text-muted">(optional)</span>
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reference or remark"
            className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] px-2 text-xs outline-none focus:border-[#8136B2]"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={busy || !milestone}
        className="mt-3 inline-flex items-center justify-center gap-2 h-9 w-full rounded-lg bg-[#8136B2] text-white text-xs font-semibold hover:bg-[#370B55] transition-colors disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <Plus className="h-3.5 w-3.5" />
            Post update
          </>
        )}
      </button>
    </div>
  );
}
