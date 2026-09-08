"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Loader2, Ship, ArrowRight, Info } from "lucide-react";

/**
 * The buyer's "ship this car home" form.
 *
 * Submitting it fans the request out to every verified forwarder registered on
 * that corridor, who then bid against each other. The buyer picks; the winner
 * gets the job and joins the shipment.
 */

interface CountryOption {
  code: string;
  name: string;
}

const MODES = [
  {
    value: "roro",
    label: "RO-RO",
    blurb: "Driven on board. Cheapest for a running car; nothing packed inside.",
  },
  {
    value: "container_lcl",
    label: "Shared container",
    blurb: "Shares a container with other cars. Protected, cheaper than a full box.",
  },
  {
    value: "container_fcl",
    label: "Full container",
    blurb: "Your own container. Best for high-value or non-running vehicles.",
  },
];

const INCOTERMS = [
  { value: "CIF", label: "CIF — freight and insurance included, you clear customs" },
  { value: "CFR", label: "CFR — freight included, you arrange insurance" },
  { value: "FOB", label: "FOB — you arrange the ocean freight" },
  { value: "DAP", label: "DAP — delivered to your address, you pay duty" },
  { value: "DDP", label: "DDP — everything included, duty as well" },
];

export function RequestShipping({
  orderId,
  destinations,
  defaultOrigin = "AE",
  vehicleSummary,
}: {
  orderId?: string;
  destinations: CountryOption[];
  defaultOrigin?: string;
  vehicleSummary?: string;
}) {
  const router = useRouter();
  const [destCountry, setDestCountry] = useState("");
  const [destCity, setDestCity] = useState("");
  const [mode, setMode] = useState("roro");
  const [incoterm, setIncoterm] = useState("CIF");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!destCountry) {
      toast.error("Choose where the car is going.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/freight/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          originCountry: defaultOrigin,
          destCountry,
          destCity: destCity.trim() || undefined,
          mode,
          incoterm,
          notes: notes.trim() || undefined,
          vehicleSummary: vehicleSummary ? { title: vehicleSummary } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        data.invited > 0
          ? `Sent to ${data.invited} freight partner${data.invited === 1 ? "" : "s"}. Quotes usually arrive within a day.`
          : "Request saved. We'll match a partner for this route shortly.",
      );
      router.push("/dashboard/shipping");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send request.");
      setBusy(false);
    }
  };

  const selectedMode = MODES.find((m) => m.value === mode);

  return (
    <div className="rounded-xl border border-[#E5E5EA] bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#E5E5EA] px-4 py-3">
        <Ship className="h-4 w-4 text-[#8136B2]" />
        <div>
          <h3 className="text-xs font-bold text-[#141414]">Ship this car</h3>
          <p className="text-[11px] text-muted">
            We&apos;ll get you quotes from verified freight partners.
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] font-semibold text-[#141414]">
              Destination country
            </span>
            <select
              value={destCountry}
              onChange={(e) => setDestCountry(e.target.value)}
              className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] px-2 text-xs outline-none focus:border-[#8136B2] bg-white"
            >
              <option value="">Select a country…</option>
              {destinations.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-[#141414]">
              City or port{" "}
              <span className="font-normal text-muted">(optional)</span>
            </span>
            <input
              value={destCity}
              onChange={(e) => setDestCity(e.target.value)}
              placeholder="e.g. Mombasa"
              className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] px-2 text-xs outline-none focus:border-[#8136B2]"
            />
          </label>
        </div>

        <fieldset>
          <legend className="text-[11px] font-semibold text-[#141414]">
            How should it travel?
          </legend>
          <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                  mode === m.value
                    ? "border-[#8136B2] bg-[#F3EDF9]"
                    : "border-[#E5E5EA] hover:border-[#B9B9C4]"
                }`}
              >
                <span className="block text-[11px] font-semibold text-[#141414]">
                  {m.label}
                </span>
              </button>
            ))}
          </div>
          {selectedMode && (
            <p className="mt-1.5 inline-flex items-start gap-1 text-[10px] text-muted leading-relaxed">
              <Info className="h-3 w-3 flex-shrink-0 mt-px" />
              {selectedMode.blurb}
            </p>
          )}
        </fieldset>

        <label className="block">
          <span className="text-[11px] font-semibold text-[#141414]">
            Terms
          </span>
          <select
            value={incoterm}
            onChange={(e) => setIncoterm(e.target.value)}
            className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] px-2 text-xs outline-none focus:border-[#8136B2] bg-white"
          >
            {INCOTERMS.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[10px] text-muted">
            Import duty at destination is usually the buyer&apos;s cost unless
            you choose DDP.
          </span>
        </label>

        <label className="block">
          <span className="text-[11px] font-semibold text-[#141414]">
            Anything else?{" "}
            <span className="font-normal text-muted">(optional)</span>
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Delivery address, timing, special handling…"
            className="mt-1 w-full rounded-lg border border-[#E5E5EA] px-2 py-2 text-xs outline-none focus:border-[#8136B2] resize-none"
          />
        </label>

        <button
          type="button"
          onClick={submit}
          disabled={busy || !destCountry}
          className="inline-flex items-center justify-center gap-2 h-10 w-full rounded-lg bg-[#8136B2] text-white text-xs font-semibold hover:bg-[#370B55] transition-colors disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Get shipping quotes
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
