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
    <div className="flex flex-col lg:flex-row bg-[#F6F7F9] min-h-screen overflow-x-hidden">
      <DashboardSidebar role={role} />
      <div className="flex-1 min-w-0 overflow-x-hidden">{children}</div>
    </div>
  );
}
