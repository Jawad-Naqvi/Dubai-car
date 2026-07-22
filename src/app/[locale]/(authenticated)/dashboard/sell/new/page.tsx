import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { SellWizard } from "@/components/sell/sell-wizard";

export const dynamic = "force-dynamic";

/**
 * The SAME sell wizard as the public /sell/new, but rendered inside the
 * dashboard shell (sidebar + header stay visible) so adding a car feels like
 * part of the app, not a jump out to the marketing site.
 */
export default function DashboardSellNewPage() {
  return (
    <>
      <DashboardHeader title="List a car" subtitle="Add a car to your inventory" />
      <main className="p-2 lg:p-4">
        <Suspense fallback={<div className="p-12 text-center text-muted text-sm">Loading…</div>}>
          <SellWizard />
        </Suspense>
      </main>
    </>
  );
}
