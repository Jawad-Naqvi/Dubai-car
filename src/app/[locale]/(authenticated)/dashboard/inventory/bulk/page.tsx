import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { BulkUpload } from "@/components/dashboard/bulk-upload";
import { getCurrentDealer } from "@/lib/data/users";

export const dynamic = "force-dynamic";

export default async function BulkInventoryPage() {
  // Bulk import is a dealer-only capability — a signed-in user without a
  // dealer record is bounced to onboarding rather than shown the tool.
  const dealer = await getCurrentDealer();
  if (!dealer) redirect("/sell/become-seller");

  return (
    <>
      <DashboardHeader
        title="Bulk upload"
        subtitle="Import your whole lot from a CSV — one row per car"
      />
      <main className="p-5 lg:p-8 max-w-3xl">
        <BulkUpload />
      </main>
    </>
  );
}
