import { DashboardHeader } from "@/components/dashboard/header";
import { DealersTable } from "@/components/admin/dealers-table";
import { getAdminDealers } from "@/lib/data/admin";

export default async function AdminDealersPage() {
  const dealers = await getAdminDealers();
  const verified = dealers.filter((d) => d.isVerified).length;

  return (
    <>
      <DashboardHeader
        title="Dealers"
        subtitle={`${dealers.length} registered · ${verified} verified`}
      />
      <DealersTable dealers={dealers} />
    </>
  );
}
