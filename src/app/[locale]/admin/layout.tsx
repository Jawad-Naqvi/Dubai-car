import { DashboardSidebar } from "@/components/dashboard/sidebar";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // No `overflow-x-hidden` here: it computes overflow-y:auto, making this a
    // scroll container that breaks the sidebar's `position: sticky`.
    <div className="flex flex-col lg:flex-row bg-[#F6F7F9] min-h-screen">
      <DashboardSidebar role="admin" />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
