import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { ListingActivity } from "@/lib/data/listing-activity";
import { MessageSquare, Layers, Package, BellRing } from "lucide-react";

function ago(iso?: string) {
  if (!iso) return null;
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * What buyers have done to this listing — messages, bulk quote requests and
 * orders — surfaced on the listing card itself so a seller sees at a glance
 * which car needs them, instead of hunting through three separate inboxes.
 * Each chip deep-links to the workspace that handles it.
 */
export function ListingActivityStrip({
  activity,
  className,
}: {
  activity?: ListingActivity;
  className?: string;
}) {
  if (!activity) return null;
  const { enquiries, newEnquiries, quotes, openQuotes, orders, openOrders } =
    activity;
  const total = enquiries + quotes + orders;

  if (total === 0) {
    return (
      <p className={cn("text-[11px] text-muted", className)}>
        No buyer activity yet.
      </p>
    );
  }

  const chips = [
    {
      show: enquiries > 0,
      href: "/dashboard/messages",
      icon: MessageSquare,
      label: `${enquiries} message${enquiries === 1 ? "" : "s"}`,
      badge: newEnquiries,
    },
    {
      show: quotes > 0,
      href: "/dashboard/quotes",
      icon: Layers,
      label: `${quotes} quote request${quotes === 1 ? "" : "s"}`,
      badge: openQuotes,
    },
    {
      show: orders > 0,
      href: "/dashboard/orders",
      icon: Package,
      label: `${orders} order${orders === 1 ? "" : "s"}`,
      badge: openOrders,
    },
  ].filter((c) => c.show);

  return (
    <div className={cn("space-y-2", className)}>
      {activity.needsAction > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6B21A8]">
          <BellRing className="h-3 w-3" />
          {activity.needsAction} item{activity.needsAction === 1 ? "" : "s"} need
          your response
          {activity.lastAt && (
            <span className="font-normal text-muted">· {ago(activity.lastAt)}</span>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={cn(
              "inline-flex items-center gap-1 h-6 px-2 rounded-full border text-[10px] font-medium transition-colors",
              c.badge > 0
                ? "border-[#8136B2]/40 bg-[#F3EDF9] text-[#6B21A8] hover:border-[#8136B2]"
                : "border-[#E5E5EA] bg-white text-secondary hover:border-[#141414]/30",
            )}
          >
            <c.icon className="h-2.5 w-2.5" />
            {c.label}
            {c.badge > 0 && (
              <span className="ms-0.5 rounded-full bg-[#8136B2] text-white px-1 leading-4">
                {c.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
