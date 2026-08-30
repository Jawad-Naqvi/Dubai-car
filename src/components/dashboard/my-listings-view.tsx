import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SellerListingActions } from "@/components/dashboard/seller-listing-actions";
import { formatAED, formatKm } from "@/lib/utils";
import type { InventoryRow } from "@/lib/data/dashboard";
import type { ListingActivity } from "@/lib/data/listing-activity";
import { ListingActivityStrip } from "./listing-activity-strip";
import { Plus, Eye, MessageCircle, Tag, PenLine } from "lucide-react";

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge tone="verified">LIVE</Badge>;
    case "pending_review":
      return <Badge tone="new">IN REVIEW</Badge>;
    case "reserved":
      return <Badge tone="reserved">RESERVED</Badge>;
    case "sold":
      return <Badge tone="featured">SOLD</Badge>;
    case "rejected":
      return <Badge tone="neutral">REJECTED</Badge>;
    case "draft":
      return <Badge tone="reserved">DRAFT</Badge>;
    default:
      return <Badge tone="neutral">{status.toUpperCase()}</Badge>;
  }
}

const STATUS_HINT: Record<string, string> = {
  draft: "Unfinished — pick up where you left off and publish when you're ready.",
  pending_review: "Our moderation team is reviewing this listing — usually within a few hours.",
  rejected: "This listing didn't pass review. Contact support for details.",
  active: "Live and visible to buyers.",
  reserved: "Marked as reserved by a buyer.",
  sold: "Marked as sold.",
  archived: "Archived — no longer visible to buyers.",
};

/** Statuses a seller may still edit — a sold/reserved car is left as-is. */
const EDITABLE = new Set(["active", "pending_review", "rejected", "draft"]);

/**
 * A buyer's own "sell my car" submissions (private seller, not a dealer
 * account). Each editable listing gets owner controls — a quick price edit and
 * a link to the full edit form — via <SellerListingActions>.
 */
export function MyListingsView({
  rows,
  activity = {},
}: {
  rows: InventoryRow[];
  activity?: Record<string, ListingActivity>;
}) {
  if (rows.length === 0) {
    return (
      <main className="p-5">
        <div className="flex flex-col items-center justify-center text-center py-24 rounded-2xl bg-white border border-[#E5E5EA] shadow-card">
          <Tag className="h-8 w-8 text-muted mb-3" />
          <h3 className="text-sm font-semibold">You haven&apos;t listed a car yet</h3>
          <p className="mt-1 text-xs text-muted max-w-xs">
            Sell your own car directly to buyers — free to list, no dealer
            account required.
          </p>
          <Button asChild variant="gold" size="md" className="mt-5">
            <Link href="/dashboard/sell/new">
              <Plus className="h-4 w-4" />
              List your car
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const totalViews = rows.reduce((s, l) => s + l.viewCount, 0);
  const totalInquiries = rows.reduce((s, l) => s + l.inquiryCount, 0);
  const liveCount = rows.filter((l) => l.status === "active").length;
  const draftCount = rows.filter((l) => l.status === "draft").length;
  // Drafts need the seller's attention most, so they sort to the top.
  const ordered = [...rows].sort(
    (a, b) => Number(b.status === "draft") - Number(a.status === "draft"),
  );
  const stats = [
    { icon: Eye, label: "Total views", value: totalViews.toLocaleString() },
    { icon: MessageCircle, label: "Total inquiries", value: totalInquiries.toLocaleString() },
    draftCount > 0
      ? { icon: PenLine, label: "Drafts", value: draftCount.toLocaleString() }
      : { icon: Tag, label: "Live listings", value: liveCount.toLocaleString() },
  ];

  return (
    <main className="p-5 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-4"
          >
            <s.icon className="h-4 w-4 text-[#8136B2]" />
            <div className="mt-2 text-lg font-bold text-[#141414]">{s.value}</div>
            <div className="text-[11px] text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end">
        <Button variant="gold" size="md" asChild>
          <Link href="/dashboard/sell/new">
            <Plus className="h-4 w-4" /> List another car
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ordered.map((l) => (
          <div
            key={l.id}
            className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-4 hover:shadow-card-hover transition-shadow"
          >
            <div className="flex gap-3">
              <div className="relative h-16 w-24 rounded-lg overflow-hidden bg-[#F4F4F6] flex-shrink-0">
                <Image src={l.imageUrl} alt="" fill sizes="96px" className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-xs truncate">{l.title}</h3>
                  {statusBadge(l.status)}
                </div>
                <div className="mt-1 text-base font-bold text-[#141414]">
                  {formatAED(l.priceAED)}
                </div>
                <div className="mt-1 text-xs text-muted">
                  {l.year} · {formatKm(l.kms)} · {l.emirate}
                </div>
              </div>
            </div>

            {/* Buyer activity on this specific car */}
            <div className="mt-3 pt-3 border-t border-[#E5E5EA]">
              <ListingActivityStrip activity={activity[l.id]} />
            </div>

            <div className="mt-3 flex items-center justify-between pt-3 border-t border-[#E5E5EA]">
              <p className="text-[11px] text-muted flex-1 pe-3">
                {STATUS_HINT[l.status] ?? ""}
              </p>
              <div className="flex items-center gap-3 flex-shrink-0 text-xs text-secondary">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-muted" />
                  {l.viewCount.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5 text-muted" />
                  {l.inquiryCount}
                </span>
              </div>
            </div>

            {EDITABLE.has(l.status) && (
              <SellerListingActions listingId={l.id} price={l.priceAED} />
            )}

            {l.status === "draft" && (
              <Button asChild variant="gold" size="sm" className="mt-2 w-full">
                <Link href={`/dashboard/my-listings/${l.id}/edit`}>
                  <PenLine className="h-3.5 w-3.5" />
                  Continue this listing
                </Link>
              </Button>
            )}

            {l.status === "active" && (
              <Button asChild variant="ghost" size="sm" className="mt-2 w-full">
                <Link href={`/listings/${l.id}/${l.slug}`}>View live listing</Link>
              </Button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
