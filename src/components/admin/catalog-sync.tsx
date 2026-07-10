"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CatalogSyncButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const run = async () => {
    setBusy(true);
    toast.info("Catalog sync started — pulling live model data…");
    try {
      const res = await fetch("/api/catalog/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.ok) {
        const s = data.stats;
        toast.success(
          `Sync complete: ${s.modelsCreated} new models, ${s.imagesResolved} images, ${s.specsResolved} spec sheets.`,
        );
        router.refresh();
      } else {
        toast.error(data.error ?? "Sync failed");
      }
    } catch {
      toast.error("Sync failed — network error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button onClick={run} disabled={busy} variant="gold" size="md">
      <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
      {busy ? "Syncing…" : "Run sync now"}
    </Button>
  );
}
