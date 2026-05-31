import { DashboardHeader } from "@/components/dashboard/header";
import { InventoryTable } from "@/components/dashboard/inventory-table";
import { getDealerInventory } from "@/lib/data/dashboard";

export default async function InventoryPage() {
  const rows = await getDealerInventory();
  const active = rows.filter((r) => r.status === "active").length;
  const pending = rows.filter((r) => r.status === "pending_review").length;

  return (
    <>
      <DashboardHeader
        title="Inventory"
        subtitle={`${rows.length} listings · ${active} active · ${pending} pending review`}
      />
      <InventoryTable rows={rows} />
    </>
  );
}
