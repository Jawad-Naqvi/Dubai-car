"use client";

import { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  InspectionReport as Report,
  CheckStatus,
} from "@/lib/inspection";

const STATUS_META: Record<
  CheckStatus,
  { icon: typeof CheckCircle2; color: string; label: string }
> = {
  pass: { icon: CheckCircle2, color: "text-[#137A43]", label: "Pass" },
  advisory: { icon: AlertTriangle, color: "text-[#B7791F]", label: "Advisory" },
  fail: { icon: XCircle, color: "text-[#C0392B]", label: "Attention" },
};

const TONE: Record<string, { ring: string; text: string; chip: string }> = {
  great: { ring: "#137A43", text: "text-[#137A43]", chip: "bg-[#E7F1EA] text-[#137A43]" },
  good: { ring: "#2F855A", text: "text-[#2F855A]", chip: "bg-[#E7F1EA] text-[#2F855A]" },
  fair: { ring: "#B7791F", text: "text-[#B7791F]", chip: "bg-[#FBF3E4] text-[#B7791F]" },
};

function verdict(r: Report): { label: string; tone: keyof typeof TONE } {
  if (r.failed > 0) return { label: "Needs attention", tone: "fair" };
  if (r.advisories === 0) return { label: "Excellent condition", tone: "great" };
  if (r.advisories <= 3) return { label: "Very good condition", tone: "good" };
  return { label: "Good condition", tone: "fair" };
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function InspectionReport({ report }: { report: Report }) {
  const v = verdict(report);
  const tone = TONE[v.tone];
  const pct = report.points
    ? Math.round((report.passed / report.points) * 100)
    : 0;
  // Expand the first category by default; the rest are collapsed.
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });

  return (
    <div className="rounded-2xl border border-[#E7E3D6] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 p-5 border-b border-[#EFEBDF] bg-[#FBFAF5]">
        <ScoreRing pct={pct} color={tone.ring} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className={cn("h-4 w-4", tone.text)} />
            <h3 className="text-base font-bold tracking-tight">
              {report.points}-point inspection
            </h3>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                tone.chip,
              )}
            >
              {v.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Inspected by{" "}
            <span className="font-medium text-secondary">
              {report.inspectorName}
            </span>{" "}
            · {fmtDate(report.inspectedAt)}
            {report.source === "dealer" ? " · dealer-verified" : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <Tally n={report.passed} label="passed" cls="text-[#137A43]" Icon={CheckCircle2} />
            {report.advisories > 0 && (
              <Tally n={report.advisories} label="advisory" cls="text-[#B7791F]" Icon={AlertTriangle} />
            )}
            {report.failed > 0 && (
              <Tally n={report.failed} label="attention" cls="text-[#C0392B]" Icon={XCircle} />
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="divide-y divide-[#EFEBDF]">
        {report.categories.map((cat, i) => {
          const adv = cat.items.filter((it) => it.status !== "pass").length;
          const isOpen = open[i] ?? false;
          return (
            <div key={cat.name}>
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [i]: !isOpen }))}
                className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-[#FBFAF5] transition-colors"
              >
                <span className="flex-1 text-sm font-semibold">{cat.name}</span>
                {adv === 0 ? (
                  <span className="text-[11px] font-medium text-[#137A43]">
                    All clear
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-[#B7791F]">
                    {adv} to review
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {isOpen && (
                <ul className="px-5 pb-4 space-y-1.5">
                  {cat.items.map((it) => {
                    const m = STATUS_META[it.status];
                    const Icon = m.icon;
                    return (
                      <li key={it.label} className="flex items-start gap-2 text-sm">
                        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", m.color)} />
                        <span className="flex-1 text-secondary">
                          {it.label}
                          {it.note && (
                            <span className="block text-xs text-muted">{it.note}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <p className="px-5 py-3 text-[11px] text-muted border-t border-[#EFEBDF] bg-[#FBFAF5]">
        Independent third-party inspection. Advisories are minor and expected for
        the car&apos;s age and mileage. Buyers may request an additional
        pre-purchase inspection.
      </p>
    </div>
  );
}

function Tally({
  n,
  label,
  cls,
  Icon,
}: {
  n: number;
  label: string;
  cls: string;
  Icon: typeof CheckCircle2;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-medium", cls)}>
      <Icon className="h-3.5 w-3.5" />
      {n} {label}
    </span>
  );
}

function ScoreRing({ pct, color }: { pct: number; color: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#EDE9DC" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold leading-none" style={{ color }}>
          {pct}%
        </span>
        <span className="text-[8px] uppercase tracking-wide text-muted">clear</span>
      </div>
    </div>
  );
}
