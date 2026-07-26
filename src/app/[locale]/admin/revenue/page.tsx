import { DashboardHeader } from "@/components/dashboard/header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { formatAED } from "@/lib/utils";
import { getRevenueData } from "@/lib/data/admin";

export default async function AdminRevenuePage() {
  const revenue = await getRevenueData();
  const mrr = revenue.totalMRR;
  const activeSubs = revenue.subscriptionSplit.reduce((s, r) => s + r.count, 0);
  const arpu = activeSubs > 0 ? Math.round(mrr / activeSubs) : 0;

  // Illustrative 6-month ramp anchored to the live MRR.
  const months = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];
  const trend = months.map((month, i) => ({
    month,
    value: Math.round(mrr * (0.6 + (i / (months.length - 1)) * 0.4)),
  }));
  const max = Math.max(1, ...trend.map((m) => m.value));

  return (
    <>
      <DashboardHeader title="Revenue" subtitle="Across all monetisation streams" />

      <main className="p-5 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "MRR", value: formatAED(mrr) },
            { label: "ARR (annualised)", value: formatAED(mrr * 12) },
            { label: "Active subscriptions", value: String(activeSubs) },
            { label: "ARPU", value: formatAED(arpu) },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl bg-white shadow-card border border-[#E5E5EA] p-5">
              <div className="text-base font-bold text-[#141414]">{k.value}</div>
              <div className="text-xs text-muted mt-2">{k.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white shadow-card border border-[#E5E5EA] p-4">
          <Eyebrow tone="gold">MRR TREND</Eyebrow>
          <h3 className="mt-3 text-xs font-semibold text-[#141414]">Last 6 months (projected)</h3>
          <div className="mt-6 flex items-end justify-between gap-3 h-64 px-2">
            {trend.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-[10px] text-secondary font-semibold">
                  {formatAED(m.value)}
                </div>
                <div
                  className="w-full rounded-t-lg bg-[#8136B2]"
                  style={{ height: `${(m.value / max) * 80}%` }}
                />
                <div className="text-xs text-muted">{m.month}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white shadow-card border border-[#E5E5EA] p-4">
            <Eyebrow tone="emerald">SUBSCRIPTION SPLIT</Eyebrow>
            <div className="mt-5 space-y-3">
              {revenue.subscriptionSplit.map((row) => (
                <div
                  key={row.tier}
                  className="flex items-center justify-between py-3 border-b border-[#E5E5EA] last:border-0"
                >
                  <div>
                    <div className="font-semibold text-xs text-[#141414]">{row.tier}</div>
                    <div className="text-xs text-muted">
                      {row.count} {row.count === 1 ? "dealer" : "dealers"}
                    </div>
                  </div>
                  <div className="font-bold text-[#141414]">{formatAED(row.mrr)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-card border border-[#E5E5EA] p-4">
            <Eyebrow tone="gold">REVENUE STREAMS</Eyebrow>
            <div className="mt-5 space-y-3">
              {revenue.streams.map((s) => {
                const maxAmt = Math.max(1, ...revenue.streams.map((x) => x.amount));
                return (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-[#141414]">{s.label}</span>
                      <span className="text-[#8136B2]">{formatAED(s.amount)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F4F4F6] overflow-hidden">
                      <div
                        className="h-full bg-[#8136B2]"
                        style={{ width: `${Math.round((s.amount / maxAmt) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
