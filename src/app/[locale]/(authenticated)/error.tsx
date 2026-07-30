"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isChunk = /ChunkLoadError|Loading chunk|dynamically imported module/i.test(
    error?.message ?? "",
  );

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="h-12 w-12 rounded-full bg-[#8136B2]/10 border border-[#8136B2]/25 grid place-items-center mx-auto">
          <AlertTriangle className="h-6 w-6 text-[#6B21A8]" />
        </div>
        <h2 className="mt-4 text-base font-bold">Something went wrong loading this page</h2>
        <p className="mt-2 text-xs text-muted">
          {isChunk
            ? "The app was updated. A quick reload will fix it."
            : "This is usually a brief network hiccup reaching the database. Try again."}
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <Button
            variant="gold"
            size="md"
            onClick={() => (isChunk ? window.location.reload() : reset())}
          >
            <RotateCw className="h-3.5 w-3.5" />
            {isChunk ? "Reload" : "Try again"}
          </Button>
        </div>
      </div>
    </div>
  );
}
