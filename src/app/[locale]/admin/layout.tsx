import { DashboardSidebar } from "@/components/dashboard/sidebar";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row bg-[#F6F7F9] min-h-screen overflow-x-hidden">
      <DashboardSidebar role="admin" />
      <div className="flex-1 min-w-0 overflow-x-hidden">{children}</div>
    </div>
  );
}
