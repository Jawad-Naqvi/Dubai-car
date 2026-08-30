import { DashboardHeader } from "@/components/dashboard/header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BuyerStats } from "@/components/dashboard/buyer-stats";
import { formatAED } from "@/lib/utils";
import {
  getDashboardStats,
  getDealerContext,
  getDealerInventory,
} from "@/lib/data/dashboard";
import { getLeadsForDealer, getMessagesForUser } from "@/lib/data/leads";
import {
  getB2BBuyerForUser,
  getExportInquiriesForUser,
} from "@/lib/data/b2b";
import { getFeaturedListings } from "@/lib/data/listings";
import {
  getDashboardRole,
  getOrSyncUser,
  getCurrentDealer,
} from "@/lib/data/users";
import { getQuotesForBuyer, getQuotesForDealer } from "@/lib/data/quotes";
import { getOrdersForBuyer, getOrdersForDealer } from "@/lib/data/orders";
import { Link } from "@/i18n/routing";
import { ListingCard } from "@/components/listings/listing-card";
import { GradientArt } from "@/components/marketing/gradient-art";
import Image from "next/image";
import {
  TrendingUp,
  Eye,
  MessageCircle,
  Car,
  Plus,
  ArrowRight,
  Search,
  Ship,
  FileText,
  Heart,
  ShieldCheck,
  Clock,
  Layers,
  Package,
} from "lucide-react";

export const dynamic = "force-dynamic";

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

const STATUS_CHIP: Record<string, string> = {
  new: "bg-[#1B4FA0]/10 text-[#1B4FA0]",
  contacted: "bg-[#8136B2]/10 text-[#6B21A8]",
  quoted: "bg-[#8136B2]/10 text-[#6B21A8]",
  closed: "bg-[#F4F4F6] text-secondary",
};

function statusChip(status: string) {
  return STATUS_CHIP[status] ?? "bg-[#F4F4F6] text-secondary";
}

/* =========================================================================
   Role router — every login opens its own overview.
   ========================================================================= */
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const role = await getDashboardRole().catch(() => "dealer" as const);
  if (role === "buyer") return <BuyerOverview locale={locale as "en" | "ar"} />;
  if (role === "b2b") return <B2BOverview />;
  return <DealerOverview />;
}

/* =========================================================================
   DEALER (also the admin fallback) — unchanged from the original overview.
   ========================================================================= */
async function DealerOverview() {
  const user = await getOrSyncUser().catch(() => null);
  const dealer = await getCurrentDealer().catch(() => null);
  const [ctx, stats, inventory, leads, quotes, orders] = await Promise.all([
    getDealerContext(),
    getDashboardStats(),
    getDealerInventory(),
    getLeadsForDealer(),
    getQuotesForDealer(dealer?.id, user?.id).catch(() => []),
    getOrdersForDealer(dealer?.id, user?.id).catch(() => []),
  ]);

  const openQuotes = quotes.filter((q) =>
    ["requested", "under_review"].includes(q.status),
  );
  const openOrders = orders.filter((o) =>
    ["pending", "confirmed", "in_progress"].includes(o.status),
  );

  const quotaPct =
    ctx.listingQuota === Infinity
      ? 30
      : Math.min(100, Math.round((ctx.listingsUsed / ctx.listingQuota) * 100));

  const kpis = [
    { label: "Active listings", value: String(stats.activeListings), icon: Car },
    { label: "Enquiries", value: String(stats.totalLeads), icon: MessageCircle },
    { label: "Quote requests", value: String(openQuotes.length), icon: Layers },
    { label: "Open orders", value: String(openOrders.length), icon: Package },
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
        {/* Verification state — a seller can set up their workspace, but their
            listings stay in review until an admin verifies their KYC. */}
        {!ctx.isVerified && (
          <div
            className={`rounded-2xl border shadow-card p-4 flex items-start gap-3 ${
              ctx.kycStatus === "rejected"
                ? "bg-[#DC2626]/5 border-[#DC2626]/25"
                : "bg-[#8136B2]/5 border-[#8136B2]/25"
            }`}
          >
            <ShieldCheck
              className={`h-5 w-5 flex-shrink-0 ${
                ctx.kycStatus === "rejected" ? "text-[#DC2626]" : "text-[#6B21A8]"
              }`}
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-semibold">
                {ctx.kycStatus === "rejected"
                  ? "Verification needs changes"
                  : "Verification in review"}
              </h2>
              <p className="mt-1 text-xs text-secondary">
                {ctx.kycStatus === "rejected"
                  ? "Your documents need an update. Resubmit to get verified and go live."
                  : "You can set up inventory and your profile now. New listings stay in review until our team verifies your Emirates ID and trade license — usually within 1–2 business days."}
              </p>
            </div>
            <Button
              asChild
              variant={ctx.kycStatus === "rejected" ? "gold" : "gold_outline"}
              size="sm"
            >
              <Link href="/sell/become-seller">
                {ctx.kycStatus === "rejected" ? "Resubmit" : "View status"}
              </Link>
            </Button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-5 hover:shadow-card-hover transition-shadow"
            >
              <k.icon className="h-5 w-5 text-[#8136B2]" />
              <div className="mt-4 text-base font-bold tracking-tight">{k.value}</div>
              <div className="text-xs text-muted mt-1">{k.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
          {/* Leads */}
          <div className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#E5E5EA]">
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
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F4F4F6] text-[10px] uppercase tracking-widest text-muted">
                  <tr>
                    <th className="text-start px-4 py-3 font-medium">Buyer</th>
                    <th className="text-start px-4 py-3 font-medium">Type</th>
                    <th className="text-start px-4 py-3 font-medium">Fee</th>
                    <th className="text-start px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice(0, 6).map((l) => (
                    <tr key={l.id} className="border-t border-[#E5E5EA] hover:bg-[#FFFFFF]">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-xs">{l.buyerName}</div>
                        <div className="text-xs text-muted">{timeAgo(l.createdAt)}</div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-secondary">
                        {LEAD_LABELS[l.type] ?? l.type}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#8136B2]">
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
              </div>
            )}
          </div>

          {/* Plan + quick actions */}
          <div className="space-y-5">
            <div className="rounded-2xl bg-bento-dark border border-[#8136B2]/25 shadow-card p-4 relative overflow-hidden grain">
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
              <div className="mt-2 h-2 rounded-full bg-[#E5E5EA] overflow-hidden">
                <div
                  className="h-full bg-[#8136B2]"
                  style={{ width: `${quotaPct}%` }}
                />
              </div>
              <Button asChild variant="gold" size="md" className="mt-5 w-full">
                <Link href="/dashboard/billing">Manage plan</Link>
              </Button>
            </div>

            {/* Quote requests needing a price — the B2B side of the pipeline */}
            <div className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-xs">Quote requests</h3>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/quotes">
                    All
                    <ArrowRight className="h-3 w-3 rtl-flip" />
                  </Link>
                </Button>
              </div>
              {openQuotes.length === 0 ? (
                <p className="mt-3 text-xs text-muted leading-relaxed">
                  No bulk enquiries waiting. Mark listings as bulk-available to
                  attract fleet and export buyers.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {openQuotes.slice(0, 3).map((q) => (
                    <Link
                      key={q.id}
                      href="/dashboard/quotes"
                      className="block rounded-lg border border-[#E5E5EA] p-2.5 hover:border-[#8136B2]/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-[#141414]">
                          {q.reference}
                        </span>
                        <span className="text-[10px] text-[#6B21A8] font-semibold">
                          {q.quantity} units
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold truncate">
                        {q.listingTitle ?? "Bulk enquiry"}
                      </p>
                      <p className="text-[10px] text-muted truncate">
                        {q.buyerCompany || q.buyerName || "Buyer"}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-4">
              <h3 className="font-semibold">Quick actions</h3>
              <div className="mt-4 space-y-2">
                <Button asChild variant="gold" size="md" className="w-full justify-start">
                  <Link href="/dashboard/sell/new">
                    <Plus className="h-4 w-4" />
                    Add listing
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="md" className="w-full justify-start">
                  <Link href="/dashboard/orders">Manage orders</Link>
                </Button>
                <Button asChild variant="ghost" size="md" className="w-full justify-start">
                  <Link href="/dashboard/billing">View invoices</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Top performing inventory */}
        <div className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#E5E5EA]">
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
          <div className="divide-y divide-[#E5E5EA]">
            {topPerformers.map((l) => (
              <div key={l.id} className="flex items-center gap-4 p-5 hover:bg-[#FFFFFF]">
                <div className="relative h-14 w-20 rounded-lg overflow-hidden bg-[#F4F4F6] flex-shrink-0">
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
                <div className="text-base font-bold text-[#141414]">
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

/* =========================================================================
   BUYER overview.
   ========================================================================= */
async function BuyerOverview({ locale }: { locale: "en" | "ar" }) {
  const user = await getOrSyncUser().catch(() => null);
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const [messages, recommended, quotes, orders] = await Promise.all([
    user ? getMessagesForUser(user.id).catch(() => []) : Promise.resolve([]),
    getFeaturedListings(8).catch(() => []),
    user ? getQuotesForBuyer(user.id).catch(() => []) : Promise.resolve([]),
    user ? getOrdersForBuyer(user.id).catch(() => []) : Promise.resolve([]),
  ]);

  const activeOrders = orders.filter((o) =>
    ["pending", "confirmed", "in_progress"].includes(o.status),
  );
  // Quotes the seller has priced are the ones needing the buyer's decision.
  const awaitingDecision = quotes.filter((q) => q.status === "responded");

  return (
    <>
      <DashboardHeader title="Your hub" subtitle="Saved cars, alerts & messages" />

      <main className="p-5 space-y-4">
        {/* Greeting / continue browsing — carries the auth-page gradient signature */}
        <div className="rounded-2xl shadow-card p-6 relative overflow-hidden">
          <GradientArt />
          <div className="relative">
            <Eyebrow tone="gold">WELCOME BACK</Eyebrow>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
              Hi {firstName}
            </h2>
            <p className="mt-1.5 text-xs text-white/60 max-w-md">
              Pick up where you left off — browse the latest arrivals, revisit your
              saved cars, or check for replies from sellers.
            </p>
            <Button asChild variant="gold" size="md" className="mt-5">
              <Link href="/buy">
                <Search className="h-4 w-4" />
                Continue browsing
              </Link>
            </Button>
          </div>
        </div>

        {/* Stat tiles (saved & alerts read client-side, messages from server) */}
        <BuyerStats messagesCount={messages.length} />

        {/* Purchases: only surfaces once the buyer actually has activity, so a
            first-time shopper never sees an empty B2B-looking panel. */}
        {(activeOrders.length > 0 || quotes.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/dashboard/orders"
              className="rounded-2xl bg-white border border-[#E5E5EA] p-5 hover:border-[#8136B2]/40 transition-colors"
            >
              <Package className="h-5 w-5 text-[#8136B2]" />
              <div className="mt-3 text-base font-bold">{activeOrders.length}</div>
              <div className="text-xs text-muted mt-0.5">
                Active order{activeOrders.length === 1 ? "" : "s"}
              </div>
            </Link>
            <Link
              href="/dashboard/quotes"
              className="rounded-2xl bg-white border border-[#E5E5EA] p-5 hover:border-[#8136B2]/40 transition-colors"
            >
              <Layers className="h-5 w-5 text-[#8136B2]" />
              <div className="mt-3 text-base font-bold">{quotes.length}</div>
              <div className="text-xs text-muted mt-0.5">
                Quote request{quotes.length === 1 ? "" : "s"}
                {awaitingDecision.length > 0 && (
                  <span className="ms-1 text-[#6B21A8] font-semibold">
                    · {awaitingDecision.length} awaiting your decision
                  </span>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* Recommended for you — real inventory, so the hub is never a dead end */}
        {recommended.length > 0 && (
          <div className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Eyebrow tone="gold">RECOMMENDED FOR YOU</Eyebrow>
                <h2 className="mt-2 text-xs font-semibold">Fresh arrivals worth a look</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/buy">
                  Browse all
                  <ArrowRight className="h-3 w-3 rtl-flip" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {recommended.slice(0, 4).map((l) => (
                <ListingCard key={l.id} listing={l} locale={locale} />
              ))}
            </div>
          </div>
        )}

        {/* Recent messages + quick links */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
          <div className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#E5E5EA]">
              <div>
                <Eyebrow tone="gold">RECENT MESSAGES</Eyebrow>
                <h2 className="mt-2 text-xs font-semibold">{messages.length} total</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/messages">
                  All messages
                  <ArrowRight className="h-3 w-3 rtl-flip" />
                </Link>
              </Button>
            </div>
            {messages.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">
                No messages yet. Inquire on a listing and replies show up here.
              </div>
            ) : (
              <div className="divide-y divide-[#E5E5EA]">
                {messages.slice(0, 4).map((m) => (
                  <div key={m.id} className="flex items-start gap-3 p-4 hover:bg-[#FFFFFF]">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs truncate">
                        {m.listingTitle ?? "Listing"}
                      </div>
                      <div className="text-xs text-muted truncate mt-0.5">
                        {m.dealerName ? `${m.dealerName} · ` : ""}
                        {m.message}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusChip(
                          m.status,
                        )}`}
                      >
                        {m.status}
                      </span>
                      <span className="text-[10px] text-muted">{timeAgo(m.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-4">
            <h3 className="font-semibold">Quick links</h3>
            <div className="mt-4 space-y-2">
              <Button asChild variant="ghost" size="md" className="w-full justify-start">
                <Link href="/dashboard/saved">
                  <Heart className="h-4 w-4" />
                  Saved cars
                </Link>
              </Button>
              <Button asChild variant="ghost" size="md" className="w-full justify-start">
                <Link href="/dashboard/alerts">Manage alerts</Link>
              </Button>
              <Button asChild variant="ghost" size="md" className="w-full justify-start">
                <Link href="/buy">Browse inventory</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

/* =========================================================================
   B2B IMPORTER overview.
   ========================================================================= */
async function B2BOverview() {
  const user = await getOrSyncUser().catch(() => null);
  const [buyer, inquiries] = await Promise.all([
    user ? getB2BBuyerForUser(user.id).catch(() => null) : Promise.resolve(null),
    user ? getExportInquiriesForUser(user.id).catch(() => []) : Promise.resolve([]),
  ]);

  const verified = buyer?.isVerified ?? false;
  const docCount = inquiries.reduce((acc, i) => acc + i.docRequests.length, 0);

  const tiles = [
    { label: "Export inquiries", value: inquiries.length, icon: Ship },
    { label: "Watchlist", value: "—", icon: Heart },
    { label: "Documents", value: docCount, icon: FileText },
  ];

  return (
    <>
      <DashboardHeader
        title="Export desk"
        subtitle={buyer?.companyName ?? "B2B importer"}
      />

      <main className="p-5 space-y-4">
        {/* Verification banner */}
        <div
          className={`rounded-2xl border shadow-card p-5 flex items-start gap-3 ${
            verified
              ? "bg-[#1A7A4A]/5 border-[#1A7A4A]/20"
              : "bg-[#8136B2]/5 border-[#8136B2]/25"
          }`}
        >
          <ShieldCheck
            className={`h-5 w-5 flex-shrink-0 ${
              verified ? "text-[#1A7A4A]" : "text-[#6B21A8]"
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold">
                {verified ? "Verified importer" : "Verification pending"}
              </h2>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  verified
                    ? "bg-[#1A7A4A]/10 text-[#1A7A4A]"
                    : "bg-[#8136B2]/10 text-[#6B21A8]"
                }`}
              >
                {verified ? "VERIFIED" : "PENDING"}
              </span>
            </div>
            <p className="mt-1 text-xs text-secondary">
              {verified
                ? "Your trade license is verified. You can request export docs and submit inquiries."
                : "Our team is reviewing your trade license. You can still browse and build a watchlist while you wait."}
            </p>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tiles.map((t) => (
            <div
              key={t.label}
              className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-5 hover:shadow-card-hover transition-shadow"
            >
              <t.icon className="h-5 w-5 text-[#8136B2]" />
              <div className="mt-4 text-base font-bold tracking-tight">{t.value}</div>
              <div className="text-xs text-muted mt-1">{t.label}</div>
            </div>
          ))}
        </div>

        {/* Recent inquiries + quick actions */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-4">
          <div className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#E5E5EA]">
              <div>
                <Eyebrow tone="gold">RECENT INQUIRIES</Eyebrow>
                <h2 className="mt-2 text-xs font-semibold">{inquiries.length} total</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/inquiries">
                  All inquiries
                  <ArrowRight className="h-3 w-3 rtl-flip" />
                </Link>
              </Button>
            </div>
            {inquiries.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">
                No export inquiries yet. Build a shipment on the export desk.
              </div>
            ) : (
              <div className="divide-y divide-[#E5E5EA]">
                {inquiries.slice(0, 4).map((i) => (
                  <div key={i.id} className="flex items-center gap-3 p-4 hover:bg-[#FFFFFF]">
                    <Ship className="h-4 w-4 text-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs truncate">
                        {i.destinationCountry} · {i.vehicleCount}{" "}
                        {i.vehicleCount === 1 ? "vehicle" : "vehicles"}
                      </div>
                      <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {timeAgo(i.createdAt)}
                        {i.shippingPreference ? ` · ${i.shippingPreference}` : ""}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold flex-shrink-0 ${statusChip(
                        i.status,
                      )}`}
                    >
                      {i.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-4">
            <h3 className="font-semibold">Quick actions</h3>
            <div className="mt-4 space-y-2">
              <Button asChild variant="gold" size="md" className="w-full justify-start">
                <Link href="/export">
                  <Ship className="h-4 w-4" />
                  Start an export inquiry
                </Link>
              </Button>
              <Button asChild variant="ghost" size="md" className="w-full justify-start">
                <Link href="/buy?exportReady=true">Browse export-ready cars</Link>
              </Button>
              <Button asChild variant="ghost" size="md" className="w-full justify-start">
                <Link href="/dashboard/documents">Document center</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
