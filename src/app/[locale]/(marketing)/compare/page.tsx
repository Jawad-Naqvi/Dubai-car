import { setRequestLocale } from "next-intl/server";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CompareView } from "@/components/listings/compare-view";

export default async function ComparePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-7xl px-4 lg:px-6 py-8">
      <Eyebrow tone="gold">SIDE BY SIDE</Eyebrow>
      <h1 className="mt-2 text-xl lg:text-2xl font-bold tracking-tight">
        Compare cars
      </h1>
      <p className="mt-1.5 text-xs text-secondary max-w-xl mb-6">
        Up to 3 vehicles, head to head. The best value in each row is highlighted.
      </p>
      <CompareView locale={locale as "en" | "ar"} />
    </div>
  );
}
