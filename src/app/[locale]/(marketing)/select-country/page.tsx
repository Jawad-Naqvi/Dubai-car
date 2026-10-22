import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { listMarkets } from "@/lib/market";
import { selectMarket } from "./actions";

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
  const markets = listMarkets();

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {markets.map((m) => (
            <form key={m.code} action={selectMarket.bind(null, locale, m.code)}>
              <button
                type="submit"
                disabled={!m.enabled}
                className="group w-full rounded-2xl border border-[#E7E4DA] bg-white shadow-card hover:border-[#C8A93E] hover:shadow-card-hover transition-all p-5 flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-4xl leading-none">{m.flag}</span>
                <span className="text-sm font-semibold text-[#141414]">
                  {m.shortName}
                </span>
                <span className="text-[10px] text-muted">
                  {m.currency}
                  {m.enabled ? "" : " · soon"}
                </span>
              </button>
            </form>
          ))}
        </div>
      </div>

      <p className="mt-10 text-[11px] text-muted max-w-xl">
        Your country sets the currency, documents and language used across the
        site. You can change it any time from here.
      </p>
    </div>
  );
}
