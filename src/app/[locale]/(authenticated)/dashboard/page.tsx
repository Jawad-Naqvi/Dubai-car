import { DashboardHeader } from "@/components/dashboard/header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAED } from "@/lib/utils";
import {
  getDashboardStats,
  getDealerContext,
  getDealerInventory,
} from "@/lib/data/dashboard";
import { getLeadsForDealer } from "@/lib/data/leads";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  Eye,
  MessageCircle,
  Car,
  Plus,
  ArrowRight,
} from "lucide-react";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const LEAD_LABELS: Record<string, string> = {
  inquiry: "Message",
  contact_unlock: "Contact unlock",
  test_drive: "Test drive",
  export_inquiry: "Export",
};

export default async function DealerOverview() {
  const [ctx, stats, inventory, leads] = await Promise.all([
    getDealerContext(),
    getDashboardStats(),
    getDealerInventory(),
    getLeadsForDealer(),
  ]);

  const quotaPct =
    ctx.listingQuota === Infinity
      ? 30
      : Math.min(100, Math.round((ctx.listingsUsed / ctx.listingQuota) * 100));

  const kpis = [
    { label: "Active listings", value: String(stats.activeListings), icon: Car },
    { label: "Total views", value: stats.totalViews.toLocaleString(), icon: Eye },
    { label: "Leads", value: String(stats.totalLeads), icon: MessageCircle },
    { label: "Revenue (mo)", value: formatAED(stats.revenueMonth), icon: TrendingUp },
  ];

  const topPerformers = [...inventory]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  return (
    <>
      <DashboardHeader
        title="Dashboard overview"
        subtitle={`${ctx.name} · ${ctx.tierName} plan`}
      />

      <main className="p-5 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-lg bg-white border border-[#E5E5E5] shadow-card p-5 hover:border-[#C8A93E]/30 hover:shadow-card-hover transition-colors"
            >
              <k.icon className="h-5 w-5 text-[#C8A93E]" />
              <div className="mt-4 text-base font-bold tracking-tight">{k.value}</div>
              <div className="text-xs text-muted mt-1">{k.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
          {/* Leads */}
          <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#E5E5E5]">
              <div>
                <Eyebrow tone="gold">RECENT LEADS</Eyebrow>
                <h2 className="mt-2 text-xs font-semibold">
                  {leads.length} total
                </h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/leads">
                  All leads
                  <ArrowRight className="h-3 w-3 rtl-flip" />
                </Link>
              </Button>
            </div>
            {leads.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">
                No leads yet. They&apos;ll appear here when buyers inquire.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#F4F4F4] text-[10px] uppercase tracking-widest text-muted">
                  <tr>
                    <th className="text-start px-4 py-3 font-medium">Buyer</th>
                    <th className="text-start px-4 py-3 font-medium">Type</th>
                    <th className="text-start px-4 py-3 font-medium">Fee</th>
                    <th className="text-start px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(0, 6).map((l) => (
                    <tr key={l.id} className="border-t border-[#E5E5E5] hover:bg-[#F8F8F8]">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-xs">{l.buyerName}</div>
                        <div className="text-xs text-muted">{timeAgo(l.createdAt)}</div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-secondary">
                        {LEAD_LABELS[l.type] ?? l.type}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#C8A93E]">
                        {l.feeAED ? formatAED(l.feeAED) : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={l.status === "new" ? "new" : "verified"}>
                          {l.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Plan + quick actions */}
          <div className="space-y-5">
            <div className="rounded-xl bg-bento-dark border border-[#C8A93E]/25 shadow-card p-4 relative overflow-hidden grain">
              <Eyebrow tone="gold">PLAN</Eyebrow>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-base font-bold">{ctx.tierName}</span>
                <span className="text-xs text-muted">
                  {ctx.monthlyAED ? `AED ${ctx.monthlyAED} / mo` : "Free"}
                </span>
              </div>
              <div className="mt-4 text-xs text-secondary">
                {ctx.listingsUsed} /{" "}
                {ctx.listingQuota === Infinity ? "∞" : ctx.listingQuota} listings used
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#E5E5E5] overflow-hidden">
                <div
                  className="h-full bg-[#C8A93E]"
                  style={{ width: `${quotaPct}%` }}
                />
              </div>
              <Button asChild variant="gold" size="md" className="mt-5 w-full">
                <Link href="/dashboard/billing">Manage plan</Link>
              </Button>
            </div>

            <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-card p-4">
              <h3 className="font-semibold">Quick actions</h3>
              <div className="mt-4 space-y-2">
                <Button asChild variant="gold" size="md" className="w-full justify-start">
                  <Link href="/sell/new">
                    <Plus className="h-4 w-4" />
                    Add listing
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="md" className="w-full justify-start">
                  <Link href="/dashboard/leads">View leads</Link>
                </Button>
                <Button asChild variant="ghost" size="md" className="w-full justify-start">
                  <Link href="/dashboard/billing">View invoices</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Top performing inventory */}
        <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#E5E5E5]">
            <div>
              <Eyebrow tone="emerald">TOP PERFORMERS</Eyebrow>
              <h2 className="mt-2 text-xs font-semibold">Your highest-traffic listings</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/inventory">
                All inventory
                <ArrowRight className="h-3 w-3 rtl-flip" />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-[#E5E5E5]">
            {topPerformers.map((l) => (
              <div key={l.id} className="flex items-center gap-4 p-5 hover:bg-[#F8F8F8]">
                <div className="relative h-14 w-20 rounded-sm overflow-hidden bg-[#F4F4F4] flex-shrink-0">
                  <Image src={l.imageUrl} alt="" fill sizes="80px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs truncate">{l.title}</div>
                  <div className="text-xs text-muted">DXB-{l.id}</div>
                </div>
                <div className="hidden md:flex items-center gap-1 text-xs text-secondary">
                  <Eye className="h-3.5 w-3.5 text-muted" />
                  {l.viewCount.toLocaleString()}
                </div>
                <div className="hidden md:flex items-center gap-1 text-xs text-secondary">
                  <MessageCircle className="h-3.5 w-3.5 text-muted" />
                  {l.inquiryCount}
                </div>
                <div className="text-base font-bold text-gradient-gold">
                  {formatAED(l.priceAED)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
