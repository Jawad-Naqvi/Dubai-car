import { Layers } from "lucide-react";
import { ContactPaywall } from "./paywall";
import { ReserveButton } from "./reserve-button";
import { RequestQuoteButton } from "@/components/quotes/request-quote-button";
import type { MockListing } from "@/lib/mock-data";

/**
 * The single place that decides what a buyer can DO with a listing.
 *
 * The marketplace is B2B *and* B2C, but a buyer should never have to know
 * that — the seller's purchase configuration decides which actions appear:
 *
 *   retail      → contact + reserve            (an ordinary consumer car)
 *   both        → contact + reserve + bulk quote
 *   quote_only  → contact + bulk quote          (wholesale allocation, no retail price)
 */
export function PurchaseActions({
  listing,
  listingTitle,
}: {
  listing: MockListing;
  listingTitle: string;
}) {
  const mode = listing.saleMode ?? "retail";
  const bulkEnabled = mode === "both" || mode === "quote_only";
  const retailEnabled = mode !== "quote_only";
  const minQty = listing.bulkMinQty ?? 2;

  return (
    <div className="space-y-2">
      <ContactPaywall
        listingId={listing.id}
        listingTitle={listingTitle}
        dealerPhone={listing.dealer.phone}
        dealerWhatsapp={listing.dealer.whatsapp}
      />

      {retailEnabled && listing.status === "active" && (
        <ReserveButton
          listingId={listing.id}
          listingTitle={listingTitle}
          priceAED={listing.priceAED}
          className="w-full"
        />
      )}

      {bulkEnabled && (
        <>
          <RequestQuoteButton
            listingId={listing.id}
            listingTitle={listingTitle}
            dealerName={listing.dealer.name}
            minQty={minQty}
            unitPriceAED={retailEnabled ? listing.priceAED : undefined}
            label={mode === "quote_only" ? "Request a quote" : "Request bulk quote"}
            variant={mode === "quote_only" ? "gold" : "gold_outline"}
            className="w-full"
          />
          <p className="flex items-start gap-1.5 text-[10px] text-[#63666A] leading-relaxed">
            <Layers className="h-3 w-3 mt-px flex-shrink-0 text-[#8136B2]" />
            <span>
              Buying for a fleet or for export? This seller takes bulk orders
              from {minQty} units
              {listing.stockQty && listing.stockQty > 1
                ? ` · ${listing.stockQty} in stock`
                : ""}
              .
            </span>
          </p>
        </>
      )}
    </div>
  );
}

/** Small inline chip for cards/rows so bulk availability is visible in search. */
export function BulkAvailableChip({
  listing,
  className = "",
}: {
  listing: Pick<MockListing, "saleMode" | "bulkMinQty">;
  className?: string;
}) {
  const mode = listing.saleMode ?? "retail";
  if (mode === "retail") return null;
  return (
    <span
      title={`Bulk orders from ${listing.bulkMinQty ?? 2} units`}
      className={`inline-flex items-center gap-1 rounded-full border border-[#8136B2]/30 bg-[#F3EDF9] px-2 py-0.5 text-[10px] font-semibold text-[#6B21A8] leading-none ${className}`}
    >
      <Layers className="h-2.5 w-2.5" />
      {mode === "quote_only" ? "Quote only" : "Bulk available"}
    </span>
  );
}
