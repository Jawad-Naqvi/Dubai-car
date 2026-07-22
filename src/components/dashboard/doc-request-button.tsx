"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// No document is processed by the platform — DXB Motors only connects buyer
// and seller; the yard provides the physical originals. This button records
// a real request against the importer's most recent export inquiry and
// emails the export desk (see /api/b2b/doc-request).
export function DocRequestButton({
  docKey,
  requested = false,
}: {
  docKey: string;
  requested?: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = useState(requested);
  const [busy, setBusy] = useState(false);

  const request = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/b2b/doc-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
      toast.success("Request sent — our export desk will follow up");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send request");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] font-semibold bg-[#F0941F]/10 text-[#C97612]">
        <Check className="h-3 w-3" />
        Requested
      </span>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={request} disabled={busy}>
      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Request"}
    </Button>
  );
}
