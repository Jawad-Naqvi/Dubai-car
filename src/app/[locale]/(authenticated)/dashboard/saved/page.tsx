import { setRequestLocale } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { SavedView } from "@/components/listings/saved-view";

export const dynamic = "force-dynamic";

export default async function SavedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale === "ar" ? "ar" : "en";

  return (
    <>
      <DashboardHeader
        title="Saved cars"
        subtitle="Cars you've hearted, kept in one place"
      />
      <main className="p-5 lg:p-8">
        <SavedView locale={loc} />
      </main>
    </>
  );
}
