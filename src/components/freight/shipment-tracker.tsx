"use client";

import {
  buyerMilestones,
  milestoneLabel,
  SHIPMENT_STATUS_LABEL,
  type MilestoneDef,
} from "@/lib/freight/milestones";
import { Check, Circle, Ship, Anchor, FileText, Clock } from "lucide-react";

/**
 * The shared progress view. Buyer, seller and forwarder all read the same
 * timeline, which is the point of putting shipping on the platform at all —
 * nobody has to email anyone to ask where the car is.
 *
 * Estimates and facts are visually distinct: an ETA is an EST event and reads
 * as "expected", while an ACT event reads as done. Conflating them is how
 * tracking pages end up lying to people.
 */

export interface TrackerEvent {
  milestone: string;
  label: string;
  classifier: string;
  eventAt: string;
  location: string | null;
  note: string | null;
  source: string;
}

export function ShipmentTracker({
  mode,
  originCountry,
  status,
  events,
}: {
  mode: string;
  originCountry: string;
  status: string;
  events: TrackerEvent[];
}) {
  const steps = buyerMilestones(mode);

  // Actual events decide what is done; estimates only annotate.
  const actual = new Map<string, TrackerEvent>();
  const estimated = new Map<string, TrackerEvent>();
  for (const e of events) {
    if (e.classifier === "ACT") actual.set(e.milestone, e);
    else if (e.classifier === "EST") estimated.set(e.milestone, e);
  }

  const lastDoneIndex = steps.reduce(
    (acc, s, i) => (actual.has(s.key) ? i : acc),
    -1,
  );

  return (
    <div className="rounded-xl border border-[#E5E5EA] bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[#E5E5EA] px-4 py-3">
        <div className="flex items-center gap-2">
          <Ship className="h-4 w-4 text-[#8136B2]" />
          <h3 className="text-xs font-bold text-[#141414]">Shipment progress</h3>
        </div>
        <span className="rounded-full bg-[#F3EDF9] px-2.5 py-1 text-[10px] font-semibold text-[#6B21A8]">
          {SHIPMENT_STATUS_LABEL[
            status as keyof typeof SHIPMENT_STATUS_LABEL
          ] ?? status}
        </span>
      </div>

      <ol className="p-4 space-y-0">
        {steps.map((step, i) => {
          const done = actual.get(step.key);
          const eta = estimated.get(step.key);
          const isNext = !done && i === lastDoneIndex + 1;
          const isLast = i === steps.length - 1;

          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full border-2 flex-shrink-0 ${
                    done
                      ? "border-[#137A43] bg-[#137A43] text-white"
                      : isNext
                        ? "border-[#8136B2] bg-white text-[#8136B2]"
                        : "border-[#E5E5EA] bg-white text-[#B9B9C4]"
                  }`}
                >
                  {done ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : (
                    <Circle className="h-2 w-2 fill-current" />
                  )}
                </span>
                {!isLast && (
                  <span
                    className={`w-0.5 flex-1 min-h-[28px] ${
                      done ? "bg-[#137A43]" : "bg-[#E5E5EA]"
                    }`}
                  />
                )}
              </div>

              <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-4"}`}>
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <h4
                    className={`text-xs font-semibold ${
                      done || isNext ? "text-[#141414]" : "text-[#8E8E93]"
                    }`}
                  >
                    {milestoneLabel(step.key, originCountry)}
                  </h4>
                  {done ? (
                    <time className="text-[10px] text-[#137A43] font-medium tabular-nums">
                      {formatDate(done.eventAt)}
                    </time>
                  ) : eta ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#8A5A12] tabular-nums">
                      <Clock className="h-2.5 w-2.5" />
                      Expected {formatDate(eta.eventAt)}
                    </span>
                  ) : null}
                </div>

                <p
                  className={`mt-0.5 text-[11px] leading-relaxed ${
                    done || isNext ? "text-secondary" : "text-muted"
                  }`}
                >
                  {step.description}
                </p>

                {done?.location && (
                  <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted">
                    <Anchor className="h-2.5 w-2.5" />
                    {done.location}
                  </p>
                )}
                {done?.note && (
                  <p className="mt-1 text-[10px] text-secondary italic">
                    {done.note}
                  </p>
                )}
                {step.documents?.length && done ? (
                  <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#6B21A8]">
                    <FileText className="h-2.5 w-2.5" />
                    {step.documents
                      .map((d) => d.replace(/_/g, " "))
                      .join(", ")}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export type { MilestoneDef };
