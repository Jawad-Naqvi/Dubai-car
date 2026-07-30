import { Link } from "@/i18n/routing";
import { DashboardHeader } from "@/components/dashboard/header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getDealerAnalytics, type Distribution } from "@/lib/data/dashboard";
import { Eye, MessageCircle, TrendingUp, Car } from "lucide-react";

function DistributionCard({
  title,
  items,
}: {
  title: string;
  items: Distribution[];
}) {
  return (
    <div className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-4">
      <h3 className="font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-xs text-muted">No data yet.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-secondary">{item.label}</span>
                <span className="text-[#141414] font-semibold">{item.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#F4F4F6] overflow-hidden">
                <div
                  className="h-full bg-[#8136B2]"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function AnalyticsPage() {
  const a = await getDealerAnalytics();
  const maxViews = Math.max(1, ...a.topListings.map((l) => l.views));

  const kpis = [
    { icon: Eye, label: "Total views", value: a.totalViews.toLocaleString() },
    { icon: MessageCircle, label: "Leads generated", value: a.totalLeads.toLocaleString() },
    { icon: TrendingUp, label: "Conversion rate", value: `${a.conversionRate}%` },
    { icon: Car, label: "Active listings", value: a.activeListings.toLocaleString() },
  ];

  return (
    <>
      <DashboardHeader
        title="Analytics"
        subtitle="Live · across your listings"
      />

      <main className="p-5 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-5 hover:shadow-card-hover transition-shadow"
            >
              <k.icon className="h-5 w-5 text-[#8136B2]" />
              <div className="mt-4 text-base font-bold">{k.value}</div>
              <div className="text-xs text-muted mt-1">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Top listings by views — real, data-bound bars (replaces the old
            hand-drawn fake trend chart). */}
        <div className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-4">
          <Eyebrow tone="gold">TOP LISTINGS BY VIEWS</Eyebrow>
          {a.topListings.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No listings yet — add inventory to see performance here.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {a.topListings.map((l) => (
                <div key={l.id} className="flex items-center gap-3">
                  <Link
                    href={`/listings/${l.id}/${l.slug}`}
                    className="w-40 shrink-0 text-xs font-medium text-[#141414] truncate hover:underline"
                    title={l.title}
                  >
                    {l.title}
                  </Link>
                  <div className="flex-1 h-4 rounded-full bg-[#F4F4F6] overflow-hidden">
                    <div
                      className="h-full bg-[#8136B2] rounded-full"
                      style={{ width: `${Math.round((l.views / maxViews) * 100)}%` }}
                    />
                  </div>
                  <div className="w-24 shrink-0 text-right text-[10px] text-muted">
                    {l.views.toLocaleString()} views · {l.inquiries} enq.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <DistributionCard title="Views by emirate" items={a.byEmirate} />
          <DistributionCard title="Leads by type" items={a.byLeadType} />
          <DistributionCard title="Views by body type" items={a.byBodyType} />
        </div>
      </main>
    </>
  );
}
