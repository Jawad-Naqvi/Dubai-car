import { setRequestLocale } from "next-intl/server";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getDashboardRole } from "@/lib/data/users";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Real per-user role routing: each login opens its own dashboard.
  const role = await getDashboardRole();

  return (
    // No `overflow-x-hidden` here: it computes overflow-y:auto, making this a
    // scroll container that breaks the sidebar's `position: sticky`.
    <div className="flex flex-col lg:flex-row bg-[#F6F7F9] min-h-screen">
      <DashboardSidebar role={role} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
