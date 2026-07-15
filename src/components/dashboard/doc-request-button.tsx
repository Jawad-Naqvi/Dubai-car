"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// Doc requests are recorded per-browser in localStorage. No document is
// processed by the platform — DXB Motors only connects buyer and seller; the
// yard provides the physical originals. This button simply signals intent so
// the export desk can follow up.
const STORAGE_KEY = "dxb:doc-requests";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function DocRequestButton({
  docKey,
  requested = false,
}: {
  docKey: string;
  requested?: boolean;
}) {
  const [done, setDone] = useState(requested);

  useEffect(() => {
    if (read().includes(docKey)) setDone(true);
  }, [docKey]);

  const request = () => {
    const next = Array.from(new Set([...read(), docKey]));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
    setDone(true);
    toast.success("Request sent — our export desk will follow up");
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
    <Button variant="ghost" size="sm" onClick={request}>
      Request
    </Button>
  );
}
