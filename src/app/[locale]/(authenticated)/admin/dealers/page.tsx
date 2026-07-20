import { DashboardHeader } from "@/components/dashboard/header";
import { DealersTable } from "@/components/admin/dealers-table";
import { getAdminDealers } from "@/lib/data/admin";

export default async function AdminDealersPage() {
  const dealers = await getAdminDealers();
  const pending = dealers.filter((d) => d.kycStatus === "pending").length;

  return (
    <>
      <DashboardHeader
        title="Dealers"
        subtitle={`${dealers.length} registered · ${pending} awaiting review`}
      />
      <DealersTable dealers={dealers} />
    </>
  );
}
