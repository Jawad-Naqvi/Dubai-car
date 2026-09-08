import { DashboardHeader } from "@/components/dashboard/header";
import { getMyShipments } from "@/lib/data/freight";
import { SHIPMENT_STATUS_LABEL } from "@/lib/freight/milestones";
import { Link } from "@/i18n/routing";
import { Ship, ArrowRight, Package } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Every shipment this account can see, resolved through organization
 * participation — a buyer sees their own cars, a dealer the ones they sold, a
 * forwarder the jobs they won. Nobody sees a shipment they aren't part of.
 */
export default async function ShipmentsPage() {
  const shipments = await getMyShipments();

  return (
    <>
      <DashboardHeader
        title="Shipments"
        subtitle={`${shipments.length} shipment${shipments.length === 1 ? "" : "s"} in progress`}
      />
      <main className="p-5">
        {shipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 rounded-xl border border-[#E5E5EA] bg-white">
            <Ship className="h-7 w-7 text-muted mb-3" />
            <h3 className="text-sm font-semibold text-[#141414]">
              No shipments yet
            </h3>
            <p className="mt-1 text-xs text-muted max-w-sm leading-relaxed">
              Once you buy a car and book shipping, its progress appears here —
              from collection through customs to final delivery.
            </p>
            <Link
              href="/dashboard/orders"
              className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#8136B2] text-white text-xs font-semibold hover:bg-[#370B55] transition-colors"
            >
              <Package className="h-3.5 w-3.5" />
              View orders
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {shipments.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/shipments/${s.id}`}
                className="group rounded-xl border border-[#E5E5EA] bg-white p-4 hover:border-[#B9B9C4] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Ship className="h-4 w-4 text-[#8136B2] flex-shrink-0" />
                      <h3 className="text-xs font-bold text-[#141414] truncate">
                        {s.reference}
                      </h3>
                    </div>
                    <p className="mt-1 text-[11px] text-secondary">
                      {s.originCountry} → {s.destCountry}
                      {s.destPort ? ` · ${s.destPort}` : ""}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {s.mode.replace(/_/g, " ")} · {s.incoterm}
                      {s.forwarderName ? ` · ${s.forwarderName}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#F3EDF9] px-2.5 py-1 text-[10px] font-semibold text-[#6B21A8] flex-shrink-0">
                    {SHIPMENT_STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#E5E5EA] pt-2.5">
                  <span className="text-[10px] text-muted tabular-nums">
                    {s.eta
                      ? `ETA ${new Date(s.eta).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`
                      : `${s.events.length} update${s.events.length === 1 ? "" : "s"}`}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8136B2]">
                    Track
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
