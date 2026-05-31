import { setRequestLocale } from "next-intl/server";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

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

  // Real role-routing happens via Clerk session claims in middleware; default
  // to dealer for the demo since that's the primary monetised user type.
  const role = "dealer" as const;

  return (
    <div className="flex flex-col lg:flex-row bg-page min-h-screen overflow-x-hidden">
      <DashboardSidebar role={role} />
      <div className="flex-1 min-w-0 overflow-x-hidden">{children}</div>
    </div>
  );
}
