import { setRequestLocale } from "next-intl/server";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SavedView } from "@/components/listings/saved-view";

export default async function SavedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 py-8">
      <Eyebrow tone="gold">YOUR GARAGE</Eyebrow>
      <h1 className="mt-2 text-xl lg:text-2xl font-bold tracking-tight">
        Saved cars
      </h1>
      <p className="mt-1.5 text-xs text-secondary max-w-xl mb-6">
        Your shortlist, saved on this device. Sign in to sync across devices.
      </p>
      <SavedView locale={locale as "en" | "ar"} />
    </div>
  );
}
