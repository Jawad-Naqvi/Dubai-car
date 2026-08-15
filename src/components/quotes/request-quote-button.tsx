"use client";

import { useState } from "react";
import { Layers } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { QuoteRequestForm } from "./quote-request-form";

/**
 * Opens the bulk-quote request. Rendered on listings that the seller marked as
 * bulk-available and on dealer profiles (where no listing is attached).
 */
export function RequestQuoteButton({
  listingId,
  listingTitle,
  dealerSlug,
  dealerName,
  minQty = 2,
  unitPriceAED,
  label = "Request bulk quote",
  variant = "gold_outline",
  className,
}: {
  listingId?: string;
  listingTitle?: string;
  dealerSlug?: string;
  dealerName?: string;
  minQty?: number;
  unitPriceAED?: number;
  label?: string;
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size="md"
        className={className}
        onClick={() => setOpen(true)}
      >
        <Layers className="h-4 w-4" />
        {label}
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={listingTitle ? "Request a bulk quote" : `Bulk enquiry — ${dealerName ?? "dealer"}`}
        description={
          listingTitle
            ? `${listingTitle} · ${dealerName ?? "Seller"} responds with pricing for your quantity.`
            : "Tell the dealer what you need and they'll come back with pricing."
        }
      >
        <QuoteRequestForm
          listingId={listingId}
          listingTitle={listingTitle}
          dealerSlug={dealerSlug}
          dealerName={dealerName}
          minQty={minQty}
          unitPriceAED={unitPriceAED}
          onDone={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
