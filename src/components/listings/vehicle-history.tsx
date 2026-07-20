import {
  ShieldCheck,
  ShieldAlert,
  FileClock,
  Users,
  Wrench,
  Gauge,
  MapPin,
  Globe,
  BadgeCheck,
} from "lucide-react";
import type { VehicleHistoryReport } from "@/lib/vehicle-history";

const TITLE_LABEL: Record<string, string> = {
  clean: "Clean title",
  salvage: "Salvage title",
  rebuilt: "Rebuilt title",
  unknown: "Not reported",
};

const IMPORT_LABEL: Record<string, string> = {
  gcc: "GCC specification",
  imported: "Imported",
  unknown: "Not reported",
};

function Row({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "good" | "warn" | "neutral";
}) {
  const color =
    tone === "good"
      ? "text-[#137A43]"
      : tone === "warn"
        ? "text-[#B4540A]"
        : "text-[#141414]";
  return (
    <div className="flex items-center gap-2.5 py-2">
      <Icon className={`h-4 w-4 flex-shrink-0 ${color}`} />
      <span className="text-xs text-secondary flex-1">{label}</span>
      <span className={`text-xs font-semibold ${color}`}>{value}</span>
    </div>
  );
}

/** Vehicle history panel for the listing detail page. */
export function VehicleHistory({ report }: { report: VehicleHistoryReport }) {
  const accidentValue =
    report.accidentsReported === null
      ? "Not reported"
      : report.accidentsReported
        ? `${report.accidents.length || "Yes"} on record`
        : "None reported";

  return (
    <div className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <FileClock className="h-4 w-4 text-[#F0941F]" />
          <h2 className="text-sm font-bold">Vehicle history</h2>
        </div>
        {report.source === "provider" ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#137A43]">
            <BadgeCheck className="h-3 w-3" /> Verified report
          </span>
        ) : report.source === "dealer" ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#137A43]">
            <BadgeCheck className="h-3 w-3" /> Dealer reported
          </span>
        ) : null}
      </div>

      <div className="divide-y divide-[#F1EFE9]">
        <Row
          icon={report.titleStatus === "clean" ? ShieldCheck : ShieldAlert}
          label="Title status"
          value={TITLE_LABEL[report.titleStatus] ?? "Not reported"}
          tone={report.titleStatus === "clean" ? "good" : report.titleStatus === "unknown" ? "neutral" : "warn"}
        />
        <Row
          icon={report.accidentsReported ? ShieldAlert : ShieldCheck}
          label="Accidents"
          value={accidentValue}
          tone={
            report.accidentsReported === false
              ? "good"
              : report.accidentsReported
                ? "warn"
                : "neutral"
          }
        />
        <Row
          icon={Users}
          label="Previous owners"
          value={report.owners === null ? "Not reported" : String(report.owners)}
        />
        <Row
          icon={Wrench}
          label="Service history"
          value={
            report.serviceRecords.length > 0
              ? `${report.serviceRecords.length} record${report.serviceRecords.length === 1 ? "" : "s"}`
              : report.serviceHistoryDeclared
                ? "Declared by seller"
                : "Not reported"
          }
          tone={report.serviceHistoryDeclared || report.serviceRecords.length > 0 ? "good" : "neutral"}
        />
        <Row
          icon={Gauge}
          label="Odometer"
          value={
            report.odometerConsistent === null
              ? "Not reported"
              : report.odometerConsistent
                ? "No rollback detected"
                : "Inconsistent"
          }
          tone={report.odometerConsistent === false ? "warn" : report.odometerConsistent ? "good" : "neutral"}
        />
        <Row
          icon={Globe}
          label="Import status"
          value={IMPORT_LABEL[report.importStatus] ?? "Not reported"}
        />
        {report.registeredEmirate && (
          <Row icon={MapPin} label="Registered in" value={report.registeredEmirate} />
        )}
      </div>

      {report.accidents.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {report.accidents.map((a, i) => (
            <div key={i} className="rounded-lg bg-[#FBF3EC] border border-[#F0D9C4] p-2 text-[11px]">
              <span className="font-semibold text-[#B4540A] capitalize">{a.severity}</span>
              <span className="text-muted"> · {a.date}</span>
              {a.note && <span className="text-secondary"> — {a.note}</span>}
            </div>
          ))}
        </div>
      )}

      {!report.complete && (
        <p className="mt-3 text-[10px] text-muted leading-relaxed">
          Based on available records and seller-declared information. A full VIN
          history report can be requested from the seller.
        </p>
      )}
    </div>
  );
}
