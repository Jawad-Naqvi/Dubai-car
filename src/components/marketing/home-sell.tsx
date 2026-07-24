"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ChevronDown, ArrowRight } from "lucide-react";
import { popularMakes, makeModels } from "@/lib/brand";

const CURRENT_YEAR = 2026;
const YEARS = Array.from({ length: CURRENT_YEAR - 1995 }, (_, i) => CURRENT_YEAR - i);

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex-1 min-w-0">
      <div className="rounded-xl border border-[#E5E5EA] bg-white px-3 pt-2 pb-1.5 focus-within:border-[#8136B2] transition-colors">
        <label className="block text-[10px] font-medium text-muted">{label}</label>
        {children}
      </div>
    </div>
  );
}

const selectCls =
  "w-full appearance-none bg-transparent pe-5 text-sm font-semibold text-[#141414] outline-none cursor-pointer truncate";
const inputCls =
  "w-full bg-transparent text-sm font-semibold text-[#141414] outline-none placeholder:font-normal placeholder:text-muted";

/**
 * cars.com-style "Sell your car" entry: capture make/model/year/kms and route
 * to either an instant valuation or the listing wizard, prefilled. Mirrors the
 * pure valuation model so the estimate the user lands on matches expectations.
 */
export function HomeSell() {
  const router = useRouter();
  const t = useTranslations("home.hero.sell");

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<string>("");
  const [kms, setKms] = useState<string>("");
  const [intent, setIntent] = useState<"estimate" | "list">("estimate");

  const models = useMemo(() => (make ? makeModels[make] ?? [] : []), [make]);

  const go = () => {
    const sp = new URLSearchParams();
    if (make) sp.set("make", make);
    if (model) sp.set("model", model);
    if (year) sp.set("year", year);
    if (kms) sp.set("kms", kms);
    const base = intent === "list" ? "/sell/new" : "/valuation";
    router.push(`${base}?${sp.toString()}`);
  };

  return (
    <div className="rounded-2xl border border-[#E5E5EA] bg-white/80 backdrop-blur p-3 shadow-card">
      <div className="flex flex-col gap-2">
        <p className="px-1 text-sm font-semibold text-[#141414]">{t("heading")}</p>

        <div className="flex gap-2">
          <Field label={t("make")}>
            <select
              value={make}
              onChange={(e) => {
                setMake(e.target.value);
                setModel("");
              }}
              suppressHydrationWarning
              className={selectCls}
            >
              <option value="">{t("makePlaceholder")}</option>
              {popularMakes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute end-3 bottom-2.5 h-4 w-4 text-muted" />
          </Field>

          <Field label={t("model")}>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              list="home-sell-models"
              placeholder={t("modelPlaceholder")}
              className={inputCls}
            />
            <datalist id="home-sell-models">
              {models.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </Field>
        </div>

        <div className="flex gap-2">
          <Field label={t("year")}>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              suppressHydrationWarning
              className={selectCls}
            >
              <option value="">—</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute end-3 bottom-2.5 h-4 w-4 text-muted" />
          </Field>

          <Field label={t("kms")}>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={kms}
              onChange={(e) => setKms(e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </Field>
        </div>

        {/* Intent — instant estimate vs. list it yourself */}
        <div className="mt-0.5 px-1">
          <span className="block text-[10px] font-medium text-muted mb-1.5">
            {t("intentLabel")}
          </span>
          <div className="grid grid-cols-2 gap-2">
            {(["estimate", "list"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setIntent(key)}
                className={
                  "h-9 rounded-lg text-xs font-semibold transition-colors " +
                  (intent === key
                    ? "bg-[#141414] text-white"
                    : "bg-white border border-[#E5E5EA] text-[#141414] hover:border-[#141414]/40")
                }
              >
                {key === "estimate" ? t("intentEstimate") : t("intentList")}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={go}
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#8136B2] text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {intent === "list" ? t("ctaList") : t("cta")}
          <ArrowRight className="h-4 w-4" />
        </button>

        <p className="px-1 text-center text-[10px] text-muted">{t("hint")}</p>
      </div>
    </div>
  );
}
