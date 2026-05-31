import { DashboardSidebar } from "@/components/dashboard/sidebar";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-page min-h-screen">
      <DashboardSidebar role="admin" />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
