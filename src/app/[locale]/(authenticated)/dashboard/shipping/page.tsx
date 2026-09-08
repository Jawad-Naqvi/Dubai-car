import { DashboardHeader } from "@/components/dashboard/header";
import { RequestShipping } from "@/components/freight/request-shipping";
import { QuoteComparison } from "@/components/freight/quote-comparison";
import { getMyFreightRequests } from "@/lib/data/freight";
import { getDestinationCountries } from "@/lib/data/countries";
import { getOrdersForBuyer } from "@/lib/data/orders";
import { getOrSyncUser } from "@/lib/data/users";

export const dynamic = "force-dynamic";

/**
 * The buyer's shipping desk: raise a request, compare the bids that come back,
 * book one. Once booked it becomes a shipment with a shared timeline.
 */
export default async function ShippingPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const user = await getOrSyncUser().catch(() => null);
  const [requests, destinations, orders] = await Promise.all([
    getMyFreightRequests(),
    getDestinationCountries(),
    user ? getOrdersForBuyer(user.id).catch(() => []) : Promise.resolve([]),
  ]);

  // "Ship it" on an order deep-links here; pre-select that car so the buyer
  // doesn't have to describe what they already bought.
  const selected = order ? orders.find((o) => o.id === order) : undefined;

  const open = requests.filter((r) => r.status === "open");

  return (
    <>
      <DashboardHeader
        title="Shipping"
        subtitle="Get quotes from verified freight partners and track your cars"
      />
      <main className="p-5 grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-4 items-start">
        <RequestShipping
          destinations={destinations}
          orderId={selected?.id}
          vehicleSummary={selected?.title ?? undefined}
        />

        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="rounded-xl border border-[#E5E5EA] bg-white px-4 py-10 text-center">
              <p className="text-[11px] text-muted leading-relaxed max-w-xs mx-auto">
                No shipping requests yet. Tell us where your car is going and
                we&apos;ll bring you quotes from partners who run that route.
              </p>
            </div>
          ) : (
            requests.map((r) => (
              <QuoteComparison
                key={r.id}
                requestReference={r.reference}
                lane={`${r.originCountry} → ${r.destCity ? `${r.destCity}, ` : ""}${r.destCountry} · ${r.mode.replace(/_/g, " ")} · ${r.incoterm}`}
                quotes={r.quotes.map((q) => ({
                  id: q.id,
                  forwarderName: q.forwarderName,
                  status: q.status,
                  currency: q.currency,
                  totalMinor: q.totalMinor,
                  transitDays: q.transitDays,
                  validUntil: q.validUntil,
                  notes: q.notes,
                }))}
                awarded={r.status === "awarded"}
              />
            ))
          )}
          {open.length > 0 && (
            <p className="text-[10px] text-muted text-center">
              Quotes are binding until their validity date if you book in time.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
