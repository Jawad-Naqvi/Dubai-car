import { cn, formatAED } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MapPin } from "lucide-react";

interface MockListingCardProps {
  title: string;
  subtitle?: string;
  priceAED: number;
  location: string;
  status?: "verified" | "reserved" | "new" | "export";
  statusLabel?: string;
  dealer?: string;
  className?: string;
}

export function MockListingCard({
  title,
  subtitle,
  priceAED,
  location,
  status = "verified",
  statusLabel,
  dealer,
  className,
}: MockListingCardProps) {
  return (
    <div
      className={cn(
        "rounded bg-[#161616]/95 border border-white/10 backdrop-blur-xl p-3.5 shadow-2xl",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-widest text-[#F0CE5C]/70 font-semibold">
            Listing
          </div>
          <div className="mt-0.5 text-xs font-semibold text-white truncate">
            {title}
          </div>
          {subtitle && (
            <div className="mt-0.5 text-[10px] text-secondary truncate">
              {subtitle}
            </div>
          )}
        </div>
        <Badge tone={status}>
          {statusLabel ?? status.toUpperCase()}
          {status === "verified" && <CheckCircle2 className="ml-0.5 h-2.5 w-2.5" />}
        </Badge>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-[9px] text-muted uppercase tracking-wider">
            Price
          </div>
          <div className="text-base font-bold text-gradient-gold">
            {formatAED(priceAED)}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-[10px] text-secondary justify-end">
            <MapPin className="h-2.5 w-2.5" />
            {location}
          </div>
          {dealer && (
            <div className="mt-0.5 text-[9px] text-muted">{dealer}</div>
          )}
        </div>
      </div>
    </div>
  );
}
