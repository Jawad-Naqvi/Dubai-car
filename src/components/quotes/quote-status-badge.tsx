import { cn } from "@/lib/utils";
// Import from the client-safe status module, NOT lib/data/* (those are
// "server-only" and would break the client bundle).
import {
  QUOTE_STATUS_LABEL,
  QUOTE_STATUS_LABEL_SELLER,
  ORDER_STATUS_LABEL,
  type QuoteStatus,
  type OrderStatus,
} from "@/lib/quote-status";

const QUOTE_TONE: Record<QuoteStatus, string> = {
  requested: "bg-[#1B4FA0]/10 text-[#1B4FA0]",
  under_review: "bg-[#B7791F]/12 text-[#8A5A12]",
  responded: "bg-[#F3EDF9] text-[#6B21A8]",
  accepted: "bg-[#137A43]/12 text-[#137A43]",
  declined: "bg-[#DC2626]/10 text-[#DC2626]",
  withdrawn: "bg-[#F4F4F6] text-[#63666A]",
  expired: "bg-[#F4F4F6] text-[#63666A]",
};

export function QuoteStatusBadge({
  status,
  audience = "buyer",
  className,
}: {
  status: QuoteStatus;
  audience?: "buyer" | "seller";
  className?: string;
}) {
  const label =
    audience === "seller"
      ? QUOTE_STATUS_LABEL_SELLER[status]
      : QUOTE_STATUS_LABEL[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none",
        QUOTE_TONE[status],
        className,
      )}
    >
      {label ?? status}
    </span>
  );
}

const ORDER_TONE: Record<OrderStatus, string> = {
  pending: "bg-[#1B4FA0]/10 text-[#1B4FA0]",
  confirmed: "bg-[#F3EDF9] text-[#6B21A8]",
  in_progress: "bg-[#B7791F]/12 text-[#8A5A12]",
  completed: "bg-[#137A43]/12 text-[#137A43]",
  cancelled: "bg-[#F4F4F6] text-[#63666A]",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none",
        ORDER_TONE[status],
        className,
      )}
    >
      {ORDER_STATUS_LABEL[status] ?? status}
    </span>
  );
}
