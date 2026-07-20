import { setRequestLocale } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { AlertsManager } from "@/components/dashboard/alerts-manager";

export const dynamic = "force-dynamic";

export default async function AlertsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <DashboardHeader
        title="Alerts"
        subtitle="Get notified when matching cars are listed"
      />
      <main className="p-5 lg:p-8">
        <AlertsManager />
      </main>
    </>
  );
}
