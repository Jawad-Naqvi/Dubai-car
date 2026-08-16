"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { LeadForm } from "./lead-form";

export function ExportQuoteButton({
  listingId,
  listingTitle,
}: {
  listingId: string;
  listingTitle: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Shipping/paperwork service — deliberately worded so it can't be
          confused with the bulk *pricing* quote on the purchase actions. */}
      <Button
        variant="gold_outline"
        size="md"
        className="mt-3 w-full"
        onClick={() => setOpen(true)}
      >
        Get shipping quote
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Get a shipping quote"
        description={`${listingTitle} — tell us where it's headed and we'll quote freight and paperwork.`}
      >
        <LeadForm
          listingId={listingId}
          listingTitle={listingTitle}
          type="export_inquiry"
          submitLabel="Request quote"
          onDone={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
