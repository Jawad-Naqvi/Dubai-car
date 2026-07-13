import { DashboardHeader } from "@/components/dashboard/header";
import { getRecentActivity } from "@/lib/data/admin";
import { Car, MessageSquare, CreditCard, Ship, Activity } from "lucide-react";

const ICONS: Record<string, typeof Car> = {
  listing: Car,
  lead: MessageSquare,
  payment: CreditCard,
  b2b: Ship,
};

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default async function AuditLogPage() {
  const items = await getRecentActivity();
  return (
    <>
      <DashboardHeader title="Activity log" subtitle="Recent platform events" />
      <main className="p-5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 rounded-2xl bg-white shadow-card border border-[#E7E4DA]">
            <Activity className="h-8 w-8 text-muted mb-3" />
            <h3 className="text-sm font-semibold text-[#141414]">No activity yet</h3>
            <p className="mt-1 text-xs text-muted">
              Listings, leads, payments, and registrations will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white shadow-card border border-[#E7E4DA] overflow-hidden divide-y divide-[#E7E4DA]">
            {items.map((a, i) => {
              const Icon = ICONS[a.type] ?? Activity;
              return (
                <div key={i} className="flex items-center gap-3 p-4 hover:bg-[#F1EFE9]">
                  <div className="h-8 w-8 rounded-full bg-[#F0941F]/10 grid place-items-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-[#F0941F]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#141414]">{a.label}</div>
                    <div className="text-[11px] text-muted truncate">{a.detail}</div>
                  </div>
                  <div className="text-[10px] text-muted flex-shrink-0">{timeAgo(a.at)}</div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
