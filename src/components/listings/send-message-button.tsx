"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { LeadForm } from "./lead-form";

export function SendMessageButton({
  listingId,
  listingTitle,
}: {
  listingId: string;
  listingTitle: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 h-9 rounded-full border border-[#141414]/20 text-[#141414] text-xs font-semibold hover:bg-[#F3F1E9] transition-colors w-full"
      >
        <Mail className="h-3 w-3" />
        Send message
      </button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Message the seller"
        description={listingTitle}
      >
        <LeadForm
          listingId={listingId}
          listingTitle={listingTitle}
          type="inquiry"
          onDone={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
