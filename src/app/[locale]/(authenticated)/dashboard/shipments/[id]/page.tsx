import { notFound } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { ShipmentTracker } from "@/components/freight/shipment-tracker";
import { MilestoneRecorder } from "@/components/freight/milestone-recorder";
import { ChatInbox } from "@/components/chat/chat-inbox";
import { getShipment } from "@/lib/data/freight";
import { getMyOrgs } from "@/lib/data/orgs";
import { INCOTERM_INFO } from "@/lib/freight/milestones";
import { Ship, Lock, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * One shipment, seen by whichever party is looking.
 *
 * getShipment returns null for anyone who isn't a participant, so an
 * unauthorized visitor gets a 404 rather than a permission error that would
 * confirm the shipment exists.
 */
export default async function ShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shipment = await getShipment(id);
  if (!shipment) notFound();

  // The forwarder assigned to this job is the one who can post updates.
  const orgs = await getMyOrgs();
  const isForwarder = orgs.some(
    (o) => o.type === "forwarder" && o.isVerified,
  );
  const incoterm = INCOTERM_INFO[shipment.incoterm];

  return (
    <>
      <DashboardHeader
        title={`Shipment ${shipment.reference}`}
        subtitle={`${shipment.originCountry} → ${shipment.destCountry} · ${shipment.mode.replace(/_/g, " ")}`}
      />
      <main className="p-5 space-y-4">
        {shipment.documentReleaseHold && (
          <div className="flex items-start gap-3 rounded-xl border border-[#B7791F]/25 bg-[#B7791F]/5 p-4">
            <Lock className="h-4 w-4 text-[#8A5A12] flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h2 className="text-xs font-semibold text-[#141414]">
                Documents held pending payment
              </h2>
              <p className="mt-1 text-[11px] text-secondary leading-relaxed">
                The Bill of Lading is a document of title — whoever holds it
                controls the cargo. It is released once the balance clears.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-4">
          <div className="space-y-4">
            <ShipmentTracker
              mode={shipment.mode}
              originCountry={shipment.originCountry}
              status={shipment.status}
              events={shipment.events}
            />
            {isForwarder && (
              <MilestoneRecorder
                shipmentId={shipment.id}
                mode={shipment.mode}
                originCountry={shipment.originCountry}
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-[#E5E5EA] bg-white p-4">
              <div className="flex items-center gap-2">
                <Ship className="h-4 w-4 text-[#8136B2]" />
                <h3 className="text-xs font-bold text-[#141414]">
                  Shipment details
                </h3>
              </div>
              <dl className="mt-3 space-y-2">
                <Row label="Forwarder" value={shipment.forwarderName} />
                <Row label="Terms" value={`${shipment.incoterm} — ${incoterm?.label ?? ""}`} />
                <Row label="Booking no." value={shipment.bookingNumber} />
                <Row label="Container" value={shipment.containerNumber} />
                <Row label="Bill of Lading" value={shipment.blNumber} />
                <Row label="Vessel" value={shipment.vesselName} />
                <Row label="Voyage" value={shipment.voyageNumber} />
                <Row label="Destination port" value={shipment.destPort} />
              </dl>
              {incoterm && (
                <p className="mt-3 border-t border-[#E5E5EA] pt-2.5 text-[10px] text-muted leading-relaxed">
                  {incoterm.note}
                </p>
              )}
            </div>

            {shipment.lines.length > 0 && (
              <div className="rounded-xl border border-[#E5E5EA] bg-white p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#8136B2]" />
                  <h3 className="text-xs font-bold text-[#141414]">
                    Vehicles on this shipment
                  </h3>
                </div>
                <ul className="mt-3 space-y-2">
                  {shipment.lines.map((l) => (
                    <li
                      key={l.id}
                      className="rounded-lg bg-[#F4F4F6] px-3 py-2"
                    >
                      <p className="text-[11px] font-semibold text-[#141414]">
                        {l.description ?? "Vehicle"}
                      </p>
                      {l.vin && (
                        <p className="text-[10px] text-muted tabular-nums">
                          VIN {l.vin}
                        </p>
                      )}
                      {l.houseBlNumber && (
                        <p className="text-[10px] text-muted">
                          HBL {l.houseBlNumber}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <section>
          <h2 className="mb-2 text-xs font-bold text-[#141414]">
            Conversation
          </h2>
          <p className="mb-3 text-[11px] text-muted">
            Buyer, seller and freight partner all talk here — one thread, no
            side emails.
          </p>
          <ChatInbox />
        </section>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[11px] text-muted flex-shrink-0">{label}</dt>
      <dd className="text-[11px] font-medium text-[#141414] text-right truncate">
        {value || "—"}
      </dd>
    </div>
  );
}
