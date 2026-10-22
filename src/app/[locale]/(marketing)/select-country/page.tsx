import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { MarketCards } from "./market-cards";

export const metadata: Metadata = {
  title: "Select your country — DXB Motors",
  description:
    "Choose your market to buy, finance, manage and sell pre-owned cars.",
};

export default async function SelectCountryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-5xl px-4 lg:px-6 py-14">
      <h1 className="text-2xl lg:text-4xl font-bold tracking-tight text-[#141414] leading-tight max-w-2xl">
        Buy, finance, manage and sell pre-owned cars
      </h1>
      <p className="mt-3 text-sm text-secondary">
        Select your country to continue.
      </p>

      <div className="mt-8">
        <div className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">
          Select a country
        </div>
        <MarketCards />
      </div>

      <p className="mt-10 text-[11px] text-muted max-w-xl">
        Your country sets the currency, documents and language used across the
        site. You can change it any time from here.
      </p>
    </div>
  );
}
