"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ImageUploader } from "@/components/sell/image-uploader";
import { estimateValue } from "@/lib/valuation";
import { formatAED } from "@/lib/utils";
import {
  popularMakes,
  bodyTypes,
  fuelTypes,
  transmissions,
  regionalSpecs,
  conditions,
  emirates,
  exteriorColors,
  interiorColors,
} from "@/lib/brand";
import { modelsForMake } from "@/lib/car-models";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Sparkles,
  ScanLine,
} from "lucide-react";

const STEPS = ["Vehicle", "Details", "Photos", "Contact"];

const COMMON_FEATURES = [
  "Sunroof",
  "Leather Seats",
  "360 Camera",
  "Apple CarPlay",
  "Adaptive Cruise",
  "Heads-up Display",
  "Cooled Seats",
  "Navigation",
  "Bluetooth",
  "Parking Sensors",
  "Keyless Entry",
  "Premium Audio",
];

const field =
  "w-full h-10 rounded-xl bg-white border border-[#E5E5EA] px-3 text-sm text-[#141414] placeholder:text-muted focus:outline-none focus:border-[#141414]/40 focus:ring-2 focus:ring-[#141414]/10";
const labelCls = "text-[11px] uppercase tracking-wider text-muted mb-1.5 block";

export function SellWizard() {
  const router = useRouter();
  const sp = useSearchParams();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: string; slug: string; status: string } | null>(null);
  const [decodingVin, setDecodingVin] = useState(false);

  const [form, setForm] = useState({
    make: sp.get("make") ?? "Toyota",
    model: sp.get("model") ?? "",
    trim: "",
    year: Number(sp.get("year")) || 2022,
    kms: Number(sp.get("kms")) || 0,
    bodyType: "SUV",
    fuel: "Petrol",
    transmission: "Automatic",
    regionalSpec: "GCC",
    condition: "Used",
    priceAED: Number(sp.get("price")) || 0,
    colorExterior: "",
    colorInterior: "",
    cylinders: "",
    vin: "",
    description: "",
    emirate: "Dubai",
    isExportReady: false,
    features: [] as string[],
    images: [] as string[],
    sellerName: "",
    sellerPhone: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const decodeVinNow = async () => {
    if (!form.vin.trim()) {
      toast.error("Enter a VIN first.");
      return;
    }
    setDecodingVin(true);
    try {
      const res = await fetch(
        `/api/catalog/decode-vin?vin=${encodeURIComponent(form.vin.trim())}`,
      );
      if (!res.ok) {
        toast.error("Could not decode this VIN — enter the details manually.");
        return;
      }
      const data = await res.json();
      setForm((f) => ({
        ...f,
        make: data.make ?? f.make,
        model: data.model ?? f.model,
        year: data.year ?? f.year,
      }));
      toast.success(`Decoded: ${data.year ?? ""} ${data.make ?? ""} ${data.model ?? ""}`.trim());
    } catch {
      toast.error("Network error — enter the details manually.");
    } finally {
      setDecodingVin(false);
    }
  };

  const suggested =
    form.make && form.year
      ? estimateValue({
          make: form.make,
          model: form.model,
          year: form.year,
          kms: form.kms,
          condition: form.condition,
        })
      : null;

  const canNext = () => {
    if (step === 0) return form.make && form.model && form.year && form.kms >= 0;
    if (step === 1) return form.priceAED > 0;
    if (step === 3) return form.sellerName && form.sellerPhone;
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cylinders: form.cylinders ? Number(form.cylinders) : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed");
      }
      const data = await res.json();
      // Individual listing fee due (only when the fee feature is enabled) —
      // send them to secure Stripe checkout; the webhook queues it for review.
      if (data.feeRequired) {
        toast.success(`Listing saved — a fee of AED ${data.feeAED} is due to publish.`);
        const fr = await fetch("/api/payments/listing-fee", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: data.id }),
        });
        const fd = await fr.json().catch(() => ({}));
        if (fr.ok && fd.url) {
          window.location.href = fd.url;
          return;
        }
        throw new Error(fd.error ?? "Could not start payment.");
      }
      setDone({ id: data.id, slug: data.slug, status: data.status });
      toast.success(
        data.status === "active" ? "Listing published!" : "Listing submitted for review!",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit listing.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    const isLive = done.status === "active";
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <div className="h-14 w-14 rounded-full bg-[#8136B2]/10 border border-[#8136B2]/30 grid place-items-center mx-auto">
          <CheckCircle2 className="h-7 w-7 text-[#8136B2]" />
        </div>
        <h1 className="mt-5 text-xl font-bold tracking-tight">
          {isLive ? "Your listing is live" : "Your listing is in review"}
        </h1>
        <p className="mt-2 text-sm text-secondary">
          {isLive
            ? `${form.year} ${form.make} ${form.model} is published and visible in search now — your verified seller status skips manual review.`
            : `${form.year} ${form.make} ${form.model} — our team reviews new listings (usually within a few hours) before they go live in search.`}
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button asChild variant="gold" size="md">
            <Link href={`/listings/${done.id}/${done.slug}`}>
              {isLive ? "View listing" : "Preview listing"}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="md">
            <Link href="/dashboard/inventory">Go to my inventory</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 lg:px-6 py-8">
      <Eyebrow tone="gold">LIST YOUR CAR</Eyebrow>
      <h1 className="mt-2 text-2xl lg:text-3xl font-light tracking-tight">
        Create <span className="font-extrabold">your listing</span>
      </h1>

      {/* Stepper */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`flex items-center gap-1.5 ${
                i <= step ? "text-[#8136B2]" : "text-muted"
              }`}
            >
              <div
                className={`h-6 w-6 rounded-full grid place-items-center text-[10px] font-semibold border ${
                  i < step
                    ? "bg-[#8136B2] text-white border-[#8136B2]"
                    : i === step
                      ? "border-[#8136B2]"
                      : "border-[#E5E5EA]"
                }`}
              >
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className="text-[11px] font-medium hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px flex-1 ${i < step ? "bg-[#8136B2]/40" : "bg-[#E5E5EA]"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-5">
        {step === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 rounded-xl bg-[#F4F4F6] border border-[#E5E5EA] p-3">
              <label className={labelCls}>Have the VIN? Skip typing it all in</label>
              <div className="flex gap-2">
                <input
                  className={field + " flex-1"}
                  value={form.vin}
                  onChange={(e) => set("vin", e.target.value)}
                  placeholder="Chassis / VIN number"
                />
                <Button
                  type="button"
                  variant="gold_outline"
                  size="md"
                  onClick={decodeVinNow}
                  disabled={decodingVin}
                  className="flex-shrink-0"
                >
                  {decodingVin ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ScanLine className="h-3.5 w-3.5" />
                  )}
                  Decode
                </Button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Make *</label>
              <select
                className={field}
                value={form.make}
                onChange={(e) =>
                  // Changing make resets the dependent model so stale
                  // make/model pairs can't be submitted.
                  setForm((f) => ({ ...f, make: e.target.value, model: "" }))
                }
              >
                {popularMakes.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Model *</label>
              {(() => {
                const models = modelsForMake(form.make);
                const isOther = form.model !== "" && !models.includes(form.model);
                if (models.length === 0) {
                  // Make not in the catalog → free text fallback.
                  return (
                    <input
                      className={field}
                      value={form.model}
                      onChange={(e) => set("model", e.target.value)}
                      placeholder="e.g. Land Cruiser"
                    />
                  );
                }
                return (
                  <>
                    <select
                      className={field}
                      value={isOther ? "__other__" : form.model}
                      onChange={(e) =>
                        set("model", e.target.value === "__other__" ? " " : e.target.value)
                      }
                    >
                      <option value="">Select model</option>
                      {models.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                      <option value="__other__">Other…</option>
                    </select>
                    {isOther && (
                      <input
                        className={`${field} mt-2`}
                        value={form.model.trim()}
                        onChange={(e) => set("model", e.target.value)}
                        placeholder="Enter model name"
                        autoFocus
                      />
                    )}
                  </>
                );
              })()}
            </div>
            <div>
              <label className={labelCls}>Trim</label>
              <input
                className={field}
                value={form.trim}
                onChange={(e) => set("trim", e.target.value)}
                placeholder="e.g. VXR"
              />
            </div>
            <div>
              <label className={labelCls}>Year *</label>
              <input
                type="number"
                className={field}
                value={form.year}
                onChange={(e) => set("year", Number(e.target.value))}
                min={1980}
                max={2027}
              />
            </div>
            <div>
              <label className={labelCls}>Kilometers *</label>
              <input
                type="number"
                className={field}
                value={form.kms}
                onChange={(e) => set("kms", Number(e.target.value))}
              />
            </div>
            <div>
              <label className={labelCls}>Body type</label>
              <select
                className={field}
                value={form.bodyType}
                onChange={(e) => set("bodyType", e.target.value)}
              >
                {bodyTypes.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Fuel</label>
              <select
                className={field}
                value={form.fuel}
                onChange={(e) => set("fuel", e.target.value)}
              >
                {fuelTypes.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Transmission</label>
              <select
                className={field}
                value={form.transmission}
                onChange={(e) => set("transmission", e.target.value)}
              >
                {transmissions.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Regional spec</label>
              <select
                className={field}
                value={form.regionalSpec}
                onChange={(e) => set("regionalSpec", e.target.value)}
              >
                {regionalSpecs.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Condition</label>
              <select
                className={field}
                value={form.condition}
                onChange={(e) => set("condition", e.target.value)}
              >
                {conditions.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            {suggested && (
              <div className="rounded-xl bg-[#F3EDF9] border border-[#E5E5EA] p-3 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-[#8136B2] mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-[#6B21A8]">
                    Suggested price: {formatAED(suggested.estimate)}
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">
                    Market range {formatAED(suggested.low)} –{" "}
                    {formatAED(suggested.high)}.{" "}
                    <button
                      type="button"
                      className="text-[#6B21A8] hover:underline"
                      onClick={() => set("priceAED", suggested.estimate)}
                    >
                      Use this
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Asking price (AED) *</label>
                <input
                  type="number"
                  className={field}
                  value={form.priceAED || ""}
                  onChange={(e) => set("priceAED", Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelCls}>Emirate</label>
                <select
                  className={field}
                  value={form.emirate}
                  onChange={(e) => set("emirate", e.target.value)}
                >
                  {emirates.map((e) => (
                    <option key={e.id}>{e.en}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Exterior colour</label>
                <input
                  className={field}
                  list="ext-colors"
                  value={form.colorExterior}
                  onChange={(e) => set("colorExterior", e.target.value)}
                  placeholder="Select or type…"
                />
                <datalist id="ext-colors">
                  {exteriorColors.map((c) => (
                    <option key={c.name} value={c.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={labelCls}>Interior colour</label>
                <input
                  className={field}
                  list="int-colors"
                  value={form.colorInterior}
                  onChange={(e) => set("colorInterior", e.target.value)}
                  placeholder="Select or type…"
                />
                <datalist id="int-colors">
                  {interiorColors.map((c) => (
                    <option key={c.name} value={c.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={labelCls}>Cylinders</label>
                <input
                  type="number"
                  className={field}
                  value={form.cylinders}
                  onChange={(e) => set("cylinders", e.target.value)}
                  placeholder="e.g. 6"
                />
              </div>
              <div>
                <label className={labelCls}>VIN (optional)</label>
                <input
                  className={field}
                  value={form.vin}
                  onChange={(e) => set("vin", e.target.value)}
                  placeholder="Chassis number"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                className="w-full rounded-xl bg-white border border-[#E5E5EA] px-3 py-2 text-sm text-[#141414] placeholder:text-muted focus:outline-none focus:border-[#141414]/40 focus:ring-2 focus:ring-[#141414]/10 min-h-[90px]"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Service history, ownership, condition notes…"
              />
            </div>
            <div>
              <label className={labelCls}>Features</label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_FEATURES.map((f) => {
                  const on = form.features.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() =>
                        set(
                          "features",
                          on
                            ? form.features.filter((x) => x !== f)
                            : [...form.features, f],
                        )
                      }
                      className={`text-[11px] px-3 py-1 rounded-full border transition-colors ${
                        on
                          ? "bg-[#141414] border-[#141414] text-white"
                          : "border-[#141414]/20 text-[#141414] hover:bg-[#141414] hover:text-white"
                      }`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isExportReady}
                onChange={(e) => set("isExportReady", e.target.checked)}
                className="h-4 w-4 rounded-sm accent-[#141414]"
              />
              <span className="text-xs text-secondary">
                This car is export-ready (RTA deregistration possible)
              </span>
            </label>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className={labelCls}>Photos</label>
            <ImageUploader
              value={form.images}
              onChange={(urls) => set("images", urls)}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Your name *</label>
                <input
                  className={field}
                  value={form.sellerName}
                  onChange={(e) => set("sellerName", e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className={labelCls}>Phone / WhatsApp *</label>
                <input
                  className={field}
                  value={form.sellerPhone}
                  onChange={(e) => set("sellerPhone", e.target.value)}
                  placeholder="+971 5..."
                />
              </div>
            </div>

            {/* Review summary */}
            <div className="rounded-2xl bg-[#F4F4F6] border border-[#E5E5EA] p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted mb-2">
                Review
              </div>
              <div className="text-sm font-semibold">
                {form.year} {form.make} {form.model}{" "}
                {form.trim && <span className="text-muted">{form.trim}</span>}
              </div>
              <div className="mt-1 text-lg font-bold text-[#141414]">
                {form.priceAED ? formatAED(form.priceAED) : "—"}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-secondary">
                <span>{form.kms.toLocaleString()} km</span>
                <span>{form.fuel}</span>
                <span>{form.transmission}</span>
                <span>{form.regionalSpec}</span>
                <span>{form.emirate}</span>
                <span>{form.images.length} photos</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="mt-5 flex items-center justify-between">
        <Button
          variant="ghost"
          size="md"
          onClick={() => (step === 0 ? router.push("/sell") : setStep(step - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
          {step === 0 ? "Cancel" : "Back"}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            variant="gold"
            size="md"
            disabled={!canNext()}
            onClick={() => setStep(step + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="gold"
            size="md"
            disabled={!canNext() || submitting}
            onClick={submit}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Publish listing
          </Button>
        )}
      </div>
    </div>
  );
}
