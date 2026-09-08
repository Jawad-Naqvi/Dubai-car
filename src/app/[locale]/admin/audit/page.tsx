import { DashboardHeader } from "@/components/dashboard/header";
import { getRecentActivity } from "@/lib/data/admin";
import { getAuditEntries } from "@/lib/audit";
import { isAdminAllowed } from "@/lib/data/users";
import {
  Car,
  MessageSquare,
  CreditCard,
  Ship,
  Activity,
  ShieldCheck,
  UserCog,
  Link2,
  Gavel,
  Package,
} from "lucide-react";

export const dynamic = "force-dynamic";

const ICONS: Record<string, typeof Car> = {
  listing: Car,
  lead: MessageSquare,
  payment: CreditCard,
  b2b: Ship,
};

/** Icon + plain-language label for each audited action. */
const AUDIT_META: Record<string, { icon: typeof Car; label: string }> = {
  "org.status_changed": { icon: ShieldCheck, label: "Organization verification" },
  "invitation.created": { icon: Link2, label: "Onboarding link issued" },
  "invitation.revoked": { icon: Link2, label: "Onboarding link revoked" },
  "invitation.accepted": { icon: Link2, label: "Invitation accepted" },
  "user.role_changed": { icon: UserCog, label: "Role changed" },
  "listing.moderated": { icon: Gavel, label: "Listing moderated" },
  "dealer.approved": { icon: ShieldCheck, label: "Dealer approved" },
  "dealer.rejected": { icon: ShieldCheck, label: "Dealer rejected" },
  "shipment.milestone_recorded": { icon: Ship, label: "Shipment milestone" },
  "freight.awarded": { icon: Package, label: "Freight booking awarded" },
  "account.type_chosen": { icon: UserCog, label: "Account type chosen" },
  "account.export_requested": { icon: UserCog, label: "Data export requested" },
  "account.deleted": { icon: UserCog, label: "Account deleted" },
  "cron.freight_expiry": { icon: Activity, label: "Scheduled: freight expiry" },
  "cron.price_drops": { icon: Activity, label: "Scheduled: price drops" },
};

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** Renders audit metadata as compact key/value chips. */
function MetaChips({ meta }: { meta: Record<string, unknown> | null }) {
  if (!meta) return null;
  const entries = Object.entries(meta).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );
  if (entries.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {entries.slice(0, 5).map(([k, v]) => (
        <span
          key={k}
          className="rounded bg-[#F4F4F6] px-1.5 py-0.5 text-[10px] text-[#63666A]"
        >
          <span className="text-[#8E8E93]">{k}</span>{" "}
          <span className="font-medium text-[#141414]">{String(v)}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Two histories in one page:
 *  - the ADMIN TRAIL (who approved, invited, promoted, moderated) — the record
 *    a compliance reviewer asks for, which did not exist before: the audit_log
 *    table was declared but had zero writers.
 *  - marketplace ACTIVITY (listings, leads, payments) for day-to-day context.
 */
export default async function AuditLogPage() {
  if (!(await isAdminAllowed())) {
    return (
      <main className="p-6">
        <p className="text-sm text-secondary">
          You do not have access to this area.
        </p>
      </main>
    );
  }

  const [audit, items] = await Promise.all([
    getAuditEntries(200),
    getRecentActivity(),
  ]);

  return (
    <>
      <DashboardHeader
        title="Audit log"
        subtitle="Every privileged action, with who did it and when"
      />
      <main className="p-5 grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4 items-start">
        <section>
          <h2 className="mb-2 text-xs font-bold text-[#141414]">
            Administrative actions
          </h2>
          {audit.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 rounded-xl bg-white border border-[#E5E5EA]">
              <ShieldCheck className="h-7 w-7 text-muted mb-3" />
              <h3 className="text-sm font-semibold text-[#141414]">
                No admin actions recorded yet
              </h3>
              <p className="mt-1 text-xs text-muted max-w-sm leading-relaxed">
                Approvals, role changes, onboarding links and moderation
                decisions are recorded here permanently.
              </p>
            </div>
          ) : (
            <ul className="rounded-xl bg-white border border-[#E5E5EA] overflow-hidden divide-y divide-[#E5E5EA]">
              {audit.map((a) => {
                const meta = AUDIT_META[a.action];
                const Icon = meta?.icon ?? Activity;
                return (
                  <li key={a.id} className="flex items-start gap-3 p-3.5">
                    <span className="h-8 w-8 rounded-lg bg-[#F3EDF9] grid place-items-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-[#8136B2]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold text-[#141414]">
                          {meta?.label ?? a.action}
                        </span>
                        <time className="text-[10px] text-muted flex-shrink-0">
                          {timeAgo(a.createdAt)}
                        </time>
                      </div>
                      <p className="mt-0.5 text-[11px] text-secondary">
                        by{" "}
                        <span className="font-medium text-[#141414]">
                          {a.actorName}
                        </span>
                        {a.entityType ? ` · ${a.entityType}` : ""}
                        {a.entityId ? ` ${a.entityId.slice(0, 8)}` : ""}
                      </p>
                      <MetaChips meta={a.metadata} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-xs font-bold text-[#141414]">
            Marketplace activity
          </h2>
          {items.length === 0 ? (
            <div className="rounded-xl bg-white border border-[#E5E5EA] px-4 py-10 text-center">
              <Activity className="h-6 w-6 text-muted mx-auto mb-2" />
              <p className="text-[11px] text-muted">
                Listings, leads and payments will appear here.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-white border border-[#E5E5EA] overflow-hidden divide-y divide-[#E5E5EA] max-h-[70vh] overflow-y-auto">
              {items.map((a, i) => {
                const Icon = ICONS[a.type] ?? Activity;
                return (
                  <div key={i} className="flex items-center gap-3 p-3.5">
                    <span className="h-8 w-8 rounded-full bg-[#8136B2]/10 grid place-items-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-[#8136B2]" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#141414]">
                        {a.label}
                      </div>
                      <div className="text-[11px] text-muted truncate">
                        {a.detail}
                      </div>
                    </div>
                    <div className="text-[10px] text-muted flex-shrink-0">
                      {timeAgo(a.at)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
