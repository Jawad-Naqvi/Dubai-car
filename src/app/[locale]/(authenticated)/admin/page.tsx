import { DashboardHeader } from "@/components/dashboard/header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { formatAED } from "@/lib/utils";
import { searchListings } from "@/lib/data/listings";
import {
  getAdminDealers,
  getAdminUsers,
  getModerationQueue,
  getRevenueData,
} from "@/lib/data/admin";
import { getLeadsForDealer } from "@/lib/data/leads";
import {
  Users,
  Building2,
  Car,
  TrendingUp,
  ShieldAlert,
  Ship,
} from "lucide-react";

const FLAGS: Record<string, string> = {
  Nigeria: "🇳🇬",
  Kenya: "🇰🇪",
  Ghana: "🇬🇭",
  Tanzania: "🇹🇿",
  Pakistan: "🇵🇰",
  "South Africa": "🇿🇦",
  Zambia: "🇿🇲",
};

export default async function AdminOverview() {
  const [listingRes, dealers, users, queue, revenue, leads] = await Promise.all([
    searchListings({ perPage: 1 }),
    getAdminDealers(),
    getAdminUsers(),
    getModerationQueue(),
    getRevenueData(),
    getLeadsForDealer(),
  ]);

  const pendingDealers = dealers.filter((d) => !d.isVerified).length;
  const buyers = users.filter((u) => u.role === "buyer").length;

  const kpis = [
    { icon: Car, label: "Active listings", value: listingRes.total.toLocaleString(), sub: `${queue.length} pending review` },
    { icon: Building2, label: "Dealers", value: String(dealers.length), sub: `${pendingDealers} unverified` },
    { icon: Users, label: "Users", value: users.length.toLocaleString(), sub: `${buyers} buyers` },
    { icon: TrendingUp, label: "MRR", value: formatAED(revenue.totalMRR), sub: "subscriptions + fees" },
  ];

  const exportLeads = leads.filter((l) => l.type === "export_inquiry" && l.destinationCountry);
  const destTally = new Map<string, number>();
  for (const l of exportLeads) {
    const c = l.destinationCountry!;
    destTally.set(c, (destTally.get(c) ?? 0) + (1));
  }
  const destinations = Array.from(destTally.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxStream = Math.max(1, ...revenue.streams.map((s) => s.amount));

  const alerts = [
    queue.length > 0 && {
      tone: "warn" as const,
      text: `${queue.length} listing${queue.length === 1 ? "" : "s"} pending review`,
    },
    pendingDealers > 0 && {
      tone: "info" as const,
      text: `${pendingDealers} dealer${pendingDealers === 1 ? "" : "s"} awaiting verification`,
    },
  ].filter(Boolean) as { tone: "warn" | "info" | "danger"; text: string }[];

  return (
    <>
      <DashboardHeader title="Admin overview" subtitle="Platform health" />

      <main className="p-5 space-y-4">
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={
                  a.tone === "danger"
                    ? "rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 px-5 py-3 flex items-center gap-3"
                    : a.tone === "warn"
                      ? "rounded-lg bg-[#B7791F]/12 border border-[#B7791F]/30 px-5 py-3 flex items-center gap-3"
                      : "rounded-lg bg-white shadow-card border border-[#C8A93E]/30 px-5 py-3 flex items-center gap-3"
                }
              >
                <ShieldAlert
                  className={
                    a.tone === "danger"
                      ? "h-4 w-4 text-[#DC2626]"
                      : a.tone === "warn"
                        ? "h-4 w-4 text-[#8A5A12]"
                        : "h-4 w-4 text-[#C8A93E]"
                  }
                />
                <span className="text-xs">{a.text}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-lg bg-white shadow-card border border-[#E5E5E5] p-5">
              <k.icon className="h-5 w-5 text-[#C8A93E]" />
              <div className="mt-4 text-base font-bold text-[#1A1A1A]">{k.value}</div>
              <div className="text-xs text-muted mt-1">{k.label}</div>
              <div className="text-[10px] text-[#C8A93E] mt-1">{k.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-lg bg-white shadow-card border border-[#E5E5E5] p-4">
            <Eyebrow tone="gold">REVENUE BY STREAM</Eyebrow>
            <h3 className="mt-3 text-xs font-semibold text-[#1A1A1A]">This period</h3>
            <div className="mt-5 space-y-3">
              {revenue.streams.map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-secondary">{row.label}</span>
                    <span className="font-semibold text-[#1A1A1A]">{formatAED(row.amount)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F4F4F4] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#D8B84E] to-[#A98F2E]"
                      style={{ width: `${Math.round((row.amount / maxStream) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-white shadow-card border border-[#E5E5E5] p-4">
            <Eyebrow tone="emerald">TOP EXPORT DESTINATIONS</Eyebrow>
            <h3 className="mt-3 text-xs font-semibold text-[#1A1A1A]">From export inquiries</h3>
            {destinations.length === 0 ? (
              <p className="mt-5 text-xs text-muted">
                No export inquiries yet. They appear here as buyers submit them.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {destinations.map((row, i) => (
                  <div
                    key={row.country}
                    className="flex items-center justify-between py-2 border-b border-[#E5E5E5] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted w-6">#{i + 1}</span>
                      <Ship className="h-4 w-4 text-[#C8A93E]" />
                      <span className="text-xs text-[#1A1A1A]">
                        {row.country} {FLAGS[row.country] ?? ""}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-[#1A1A1A]">
                      {row.count} {row.count === 1 ? "inquiry" : "inquiries"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
