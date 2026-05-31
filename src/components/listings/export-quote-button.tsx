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
      <Button
        variant="gold"
        size="md"
        className="mt-3 w-full"
        onClick={() => setOpen(true)}
      >
        Request export quote
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Request export quote"
        description={`${listingTitle} — tell us where it's headed.`}
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
