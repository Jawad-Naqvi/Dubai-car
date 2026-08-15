"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/sell/image-uploader";
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
import type { EditableListing } from "@/lib/data/listing-write";
import { Loader2 } from "lucide-react";

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

/**
 * Single-page edit form for a listing the seller owns. Prefilled from the
 * current values and PUT to /api/listings/[id]; a price change here flows
 * through the same price-history / "price drop" path as the quick reprice.
 */
export function ListingEditForm({ listing }: { listing: EditableListing }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    make: listing.make,
    model: listing.model,
    trim: listing.trim,
    year: listing.year,
    kms: listing.kms,
    priceAED: listing.priceAED,
    bodyType: listing.bodyType || "SUV",
    fuel: listing.fuel || "Petrol",
    transmission: listing.transmission || "Automatic",
    regionalSpec: listing.regionalSpec || "GCC",
    condition: listing.condition || "Used",
    colorExterior: listing.colorExterior,
    colorInterior: listing.colorInterior,
    cylinders: listing.cylinders,
    vin: listing.vin,
    emirate: listing.emirate,
    description: listing.description,
    isExportReady: listing.isExportReady,
    features: listing.features,
    images: listing.images,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const priceChanged = form.priceAED !== listing.priceAED;

  const save = async () => {
    if (!form.make || !form.model || !form.year) {
      toast.error("Make, model and year are required.");
      return;
    }
    if (!(form.priceAED > 0)) {
      toast.error("Enter a valid asking price.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          cylinders: form.cylinders ? Number(form.cylinders) : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save changes.");
      toast.success(
        priceChanged && form.priceAED < listing.priceAED
          ? "Saved — buyers will see a price-drop badge."
          : "Listing updated.",
      );
      router.push("/dashboard/my-listings");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const models = modelsForMake(form.make);
  const isOtherModel = form.model !== "" && !models.includes(form.model);

  return (
    <main className="p-5">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Vehicle */}
        <section className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-5">
          <h2 className="text-sm font-bold mb-4">Vehicle</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Make *</label>
              <select
                className={field}
                value={form.make}
                onChange={(e) =>
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
              {models.length === 0 ? (
                <input
                  className={field}
                  value={form.model}
                  onChange={(e) => set("model", e.target.value)}
                  placeholder="e.g. Land Cruiser"
                />
              ) : (
                <>
                  <select
                    className={field}
                    value={isOtherModel ? "__other__" : form.model}
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
                  {isOtherModel && (
                    <input
                      className={`${field} mt-2`}
                      value={form.model.trim()}
                      onChange={(e) => set("model", e.target.value)}
                      placeholder="Enter model name"
                    />
                  )}
                </>
              )}
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
        </section>

        {/* Pricing & details */}
        <section className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-5">
          <h2 className="text-sm font-bold mb-4">Pricing &amp; details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Asking price (AED) *</label>
              <input
                type="number"
                className={field}
                value={form.priceAED || ""}
                onChange={(e) => set("priceAED", Number(e.target.value))}
                placeholder="0"
                min={1000}
              />
              {priceChanged && (
                <p className="mt-1 text-[11px] text-muted">
                  Was {formatAED(listing.priceAED)}
                  {form.priceAED < listing.priceAED
                    ? " — buyers will see a price-drop badge."
                    : "."}
                </p>
              )}
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
              <label className={labelCls}>VIN</label>
              <input
                className={field}
                value={form.vin}
                onChange={(e) => set("vin", e.target.value)}
                placeholder="Chassis number"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelCls}>Description</label>
            <textarea
              className="w-full rounded-xl bg-white border border-[#E5E5EA] px-3 py-2 text-sm text-[#141414] placeholder:text-muted focus:outline-none focus:border-[#141414]/40 focus:ring-2 focus:ring-[#141414]/10 min-h-[90px]"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Service history, ownership, condition notes…"
            />
          </div>
          <div className="mt-4">
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
          <label className="mt-4 flex items-center gap-2 cursor-pointer">
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
        </section>

        {/* Photos */}
        <section className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-5">
          <h2 className="text-sm font-bold mb-4">Photos</h2>
          <ImageUploader
            value={form.images}
            onChange={(urls) => set("images", urls)}
          />
        </section>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="md"
            onClick={() => router.push("/dashboard/my-listings")}
          >
            Cancel
          </Button>
          <Button variant="gold" size="md" onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </div>
    </main>
  );
}
