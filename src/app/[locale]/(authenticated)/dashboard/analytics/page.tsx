import { Link } from "@/i18n/routing";
import type { LucideIcon } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Eyebrow } from "@/components/ui/eyebrow";
import {
  getDealerAnalytics,
  type Distribution,
  type TimeRange,
  type StageCount,
} from "@/lib/data/dashboard";
import { formatAED } from "@/lib/utils";
import { Eye, MessageCircle, Layers, Package, Clock } from "lucide-react";

function TimeRangeCard({
  title,
  icon: Icon,
  range,
}: {
  title: string;
  icon: LucideIcon;
  range: TimeRange;
}) {
  const cells = [
    { label: "Today", value: range.today },
    { label: "Last 7 days", value: range.last7 },
    { label: "Last 30 days", value: range.last30 },
  ];
  return (
    <div className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#8136B2]" />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {cells.map((c) => (
          <div key={c.label} className="rounded-xl bg-[#F9F8FC] p-3 text-center">
            <div className="text-lg font-bold text-[#141414]">
              {c.value.toLocaleString()}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted mt-0.5">
              {c.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

/**
 * A stage board — the status of every record in one funnel, with the money
 * each stage represents where that's meaningful.
 */
function StageBoard({
  title,
  subtitle,
  stages,
  href,
  accent = "#8136B2",
}: {
  title: string;
  subtitle?: string;
  stages: StageCount[];
  href?: string;
  accent?: string;
}) {
  const total = stages.reduce((s, x) => s + x.count, 0);
  const max = Math.max(1, ...stages.map((s) => s.count));
  return (
    <div className="rounded-2xl bg-white border border-[#E5E5EA] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          {subtitle && (
            <p className="text-[11px] text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="text-[11px] font-semibold text-[#141414] underline underline-offset-2 hover:opacity-70 flex-shrink-0"
          >
            Open
          </Link>
        )}
      </div>

      {total === 0 ? (
        <p className="mt-4 text-xs text-muted">Nothing here yet.</p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {stages.map((s) => (
            <div key={s.key}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-secondary truncate">{s.label}</span>
                <span className="flex items-baseline gap-2 flex-shrink-0">
                  {s.valueAED ? (
                    <span className="text-[10px] text-muted">
                      {formatAED(s.valueAED)}
                    </span>
                  ) : null}
                  <span className="text-[#141414] font-bold">{s.count}</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-[#F4F4F6] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round((s.count / max) * 100)}%`,
                    backgroundColor: s.count ? accent : "transparent",
                  }}
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
  const p = a.pipeline;

  const kpis = [
    { icon: Eye, label: "Total views", value: a.totalViews.toLocaleString() },
    { icon: MessageCircle, label: "Enquiries", value: a.totalLeads.toLocaleString() },
    { icon: Layers, label: "Quote requests", value: p.totals.quoteRequests.toLocaleString() },
    { icon: Package, label: "Open orders", value: p.totals.openOrders.toLocaleString() },
  ];

  // Money moving through the funnel, plus how the dealer is performing on it.
  const commercial = [
    {
      label: "Quoted value",
      value: formatAED(p.totals.quotedValueAED),
      hint: "Total priced to buyers",
    },
    {
      label: "Accepted value",
      value: formatAED(p.totals.acceptedValueAED),
      hint: "Quotes buyers said yes to",
    },
    {
      label: "Open order value",
      value: formatAED(p.totals.openOrderValueAED),
      hint: "In the pipeline now",
    },
    {
      label: "Completed",
      value: formatAED(p.totals.completedValueAED),
      hint: "Delivered and closed",
    },
  ];

  return (
    <>
      <DashboardHeader
        title="Analytics"
        subtitle="Live · traffic, enquiries, quotes and orders"
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

        {/* ---- Status of everything ---- */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StageBoard
            title="Listings"
            subtitle="Inventory by state"
            stages={p.listings}
            href="/dashboard/inventory"
            accent="#370B55"
          />
          <StageBoard
            title="Enquiries"
            subtitle="Individual buyers"
            stages={p.enquiries}
            href="/dashboard/leads"
            accent="#1B4FA0"
          />
          <StageBoard
            title="Quote requests"
            subtitle="Bulk / business buyers"
            stages={p.quotes}
            href="/dashboard/quotes"
          />
          <StageBoard
            title="Orders"
            subtitle="Reservations + accepted quotes"
            stages={p.orders}
            href="/dashboard/orders"
            accent="#137A43"
          />
        </div>

        {/* ---- Commercial value + performance ---- */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          <div className="rounded-2xl bg-white border border-[#E5E5EA] p-4">
            <Eyebrow tone="gold">PIPELINE VALUE</Eyebrow>
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {commercial.map((c) => (
                <div key={c.label} className="rounded-xl bg-[#F9F8FC] p-3">
                  <div className="text-sm font-bold text-[#141414]">
                    {c.value}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted mt-1">
                    {c.label}
                  </div>
                  <div className="text-[10px] text-muted mt-0.5">{c.hint}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#E5E5EA] p-4">
            <Eyebrow tone="gold">HOW YOU&apos;RE DOING</Eyebrow>
            <div className="mt-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-secondary">Quote win rate</span>
                <span className="text-base font-bold text-[#141414]">
                  {p.totals.quoteWinRate}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#F4F4F6] overflow-hidden">
                <div
                  className="h-full bg-[#137A43] rounded-full"
                  style={{ width: `${p.totals.quoteWinRate}%` }}
                />
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs text-secondary flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted" />
                  Median response time
                </span>
                <span className="text-base font-bold text-[#141414]">
                  {p.totals.medianResponseHours === null
                    ? "—"
                    : `${p.totals.medianResponseHours}h`}
                </span>
              </div>
              <p className="text-[10px] text-muted leading-relaxed">
                Buyers who get priced within a few hours are far more likely to
                accept. Win rate counts accepted quotes against the ones you
                actually responded to.
              </p>
            </div>
          </div>
        </div>

        {/* Rolling-window breakdowns (real, from the view-event timeline). */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TimeRangeCard
            title="Views"
            icon={Eye}
            range={a.timeRanges.views}
          />
          <TimeRangeCard
            title="Leads"
            icon={MessageCircle}
            range={a.timeRanges.leads}
          />
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
