import { DashboardHeader } from "@/components/dashboard/header";
import { ReportsQueue } from "@/components/admin/reports-queue";
import { listReports } from "@/lib/data/reports";

export default async function AdminReportsPage() {
  const reports = await listReports();
  const open = reports.filter((r) => r.status === "open").length;

  return (
    <>
      <DashboardHeader
        title="Reported listings"
        subtitle={`${open} open · ${reports.length} total`}
      />
      <main className="p-5">
        <ReportsQueue initial={reports} />
      </main>
    </>
  );
}
