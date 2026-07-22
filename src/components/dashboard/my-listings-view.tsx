import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAED, formatKm } from "@/lib/utils";
import type { InventoryRow } from "@/lib/data/dashboard";
import { Plus, Eye, MessageCircle, Tag } from "lucide-react";

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
    default:
      return <Badge tone="neutral">{status.toUpperCase()}</Badge>;
  }
}

const STATUS_HINT: Record<string, string> = {
  pending_review: "Our moderation team is reviewing this listing — usually within a few hours.",
  rejected: "This listing didn't pass review. Contact support for details.",
  active: "Live and visible to buyers.",
  reserved: "Marked as reserved by a buyer.",
  sold: "Marked as sold.",
  archived: "Archived — no longer visible to buyers.",
};

/**
 * Read-only view of a buyer's own "sell my car" submissions (private seller,
 * not a dealer account). Intentionally has no edit/delete actions here —
 * changes go through /sell/new's moderation flow, keeping this a simple
 * status tracker rather than a management console.
 */
export function MyListingsView({ rows }: { rows: InventoryRow[] }) {
  if (rows.length === 0) {
    return (
      <main className="p-5">
        <div className="flex flex-col items-center justify-center text-center py-24 rounded-3xl bg-white border border-[#E7E4DA] shadow-card">
          <Tag className="h-8 w-8 text-muted mb-3" />
          <h3 className="text-sm font-semibold">You haven&apos;t listed a car yet</h3>
          <p className="mt-1 text-xs text-muted max-w-xs">
            Sell your own car directly to buyers — free to list, no dealer
            account required.
          </p>
          <Button asChild variant="gold" size="md" className="mt-5">
            <Link href="/sell/new">
              <Plus className="h-4 w-4" />
              List your car
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="p-5 space-y-4">
      <div className="flex items-center justify-end">
        <Button variant="gold" size="md" asChild>
          <Link href="/sell/new">
            <Plus className="h-4 w-4" /> List another car
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((l) => (
          <div
            key={l.id}
            className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-4 hover:shadow-card-hover transition-shadow"
          >
            <div className="flex gap-3">
              <div className="relative h-16 w-24 rounded-lg overflow-hidden bg-[#F3F1E9] flex-shrink-0">
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

            <div className="mt-3 flex items-center justify-between pt-3 border-t border-[#E7E4DA]">
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

            {l.status === "active" && (
              <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
                <Link href={`/listings/${l.id}/${l.slug}`}>View live listing</Link>
              </Button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
