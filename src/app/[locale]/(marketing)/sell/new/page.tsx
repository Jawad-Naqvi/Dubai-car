import { Suspense } from "react";
import { SellWizard } from "@/components/sell/sell-wizard";

export default function SellNewPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted text-sm">Loading…</div>}>
      <SellWizard />
    </Suspense>
  );
}
