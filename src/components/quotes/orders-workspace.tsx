"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter, Link } from "@/i18n/routing";
import { formatAED, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "./quote-status-badge";
import type { OrderView, OrderStatus } from "@/lib/data/orders";
import { Package, Layers, ShoppingBag,
  Ship,
} from "lucide-react";

const FILTERS = [
  { key: "open", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
] as const;

function inFilter(o: OrderView, key: string) {
  if (key === "open")
    return ["pending", "confirmed", "in_progress"].includes(o.status);
  if (key === "completed") return o.status === "completed";
  if (key === "cancelled") return o.status === "cancelled";
  return true;
}

/** Seller's next step in the pipeline, or null at a terminal state. */
const NEXT_STATUS: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> =
  {
    pending: { to: "confirmed", label: "Confirm order" },
    confirmed: { to: "in_progress", label: "Mark in progress" },
    in_progress: { to: "completed", label: "Mark completed" },
  };

/**
 * Order pipeline shared by both journeys — a single reserved car and an
 * accepted bulk quote appear in the same list, tagged by kind.
 */
export function OrdersWorkspace({
  orders: initial,
  audience,
}: {
  orders: OrderView[];
  audience: "buyer" | "seller";
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initial);
  const [filter, setFilter] = useState<string>("open");
  const [busy, setBusy] = useState<string | null>(null);

  const visible = useMemo(
    () => orders.filter((o) => inFilter(o, filter)),
    [orders, filter],
  );

  const move = async (order: OrderView, status: OrderStatus) => {
    setBusy(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update");
      setOrders((list) =>
        list.map((o) => (o.id === order.id ? { ...o, status } : o)),
      );
      toast.success("Order updated");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="rounded-lg bg-white border border-[#E5E5EA] p-10 text-center">
        <Package className="h-8 w-8 text-muted mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-[#141414]">No orders yet</h3>
        <p className="mt-1 text-xs text-muted max-w-sm mx-auto leading-relaxed">
          {audience === "buyer"
            ? "Reserve a car or accept a bulk quote and it'll show up here with its status."
            : "Reservations from buyers and accepted quotes both land here as orders."}
        </p>
        {audience === "buyer" && (
          <Button asChild variant="gold" size="md" className="mt-4">
            <Link href="/buy">Browse cars</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map((f) => {
          const count = orders.filter((o) => inFilter(o, f.key)).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "h-7 px-3 rounded-full border text-[11px] font-medium transition-colors",
                filter === f.key
                  ? "bg-[#141414] text-white border-[#141414]"
                  : "bg-white text-secondary border-[#E5E5EA] hover:border-[#141414]/30",
              )}
            >
              {f.label}
              <span className="ml-1 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {visible.map((o) => {
          const next = NEXT_STATUS[o.status];
          return (
            <div
              key={o.id}
              className="rounded-lg bg-white border border-[#E5E5EA] p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="h-10 w-10 rounded-md bg-[#F3EDF9] flex items-center justify-center flex-shrink-0">
                {o.kind === "bulk" ? (
                  <Layers className="h-4 w-4 text-[#8136B2]" />
                ) : (
                  <ShoppingBag className="h-4 w-4 text-[#8136B2]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-[#141414]">
                    {o.reference}
                  </span>
                  <OrderStatusBadge status={o.status} />
                  {o.kind === "bulk" && (
                    <span className="text-[10px] text-[#6B21A8] font-semibold">
                      Bulk order
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm font-semibold text-[#141414] truncate">
                  {o.title}
                </p>
                <p className="mt-0.5 text-[11px] text-[#63666A]">
                  {o.quantity > 1 ? `${o.quantity} units · ` : ""}
                  {audience === "buyer"
                    ? o.dealerName
                    : o.buyerName || o.buyerEmail || "Buyer"}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-base font-bold text-[#141414]">
                  {formatAED(o.totalAED)}
                </div>
                {o.quantity > 1 && (
                  <div className="text-[10px] text-muted">
                    {formatAED(o.unitPriceAED)} / unit
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {/* Freight is offered where the need actually arises — on a
                    confirmed order — rather than only in the sidebar. */}
                {audience === "buyer" &&
                  o.status !== "cancelled" && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/shipping?order=${o.id}`}>
                        <Ship className="h-3 w-3" />
                        Ship it
                      </Link>
                    </Button>
                  )}
                {audience === "seller" && next && (
                  <Button
                    variant="gold"
                    size="sm"
                    disabled={busy === o.id}
                    onClick={() => move(o, next.to)}
                  >
                    {next.label}
                  </Button>
                )}
                {o.status !== "completed" && o.status !== "cancelled" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy === o.id}
                    onClick={() => move(o, "cancelled")}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="rounded-lg bg-white border border-[#E5E5EA] p-6 text-center text-xs text-muted">
            Nothing in this view.
          </p>
        )}
      </div>
    </div>
  );
}
