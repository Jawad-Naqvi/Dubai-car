"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { Loader2, Plus, Route } from "lucide-react";

/**
 * Where a forwarder declares the corridors they actually serve.
 *
 * This is what makes the RFQ fan-out targeted rather than a blast: a request
 * for Dubai to Mombasa reaches only forwarders who registered that lane. Both
 * sides win — buyers get bids from people who really run the route, and
 * forwarders aren't buried in work they can't take.
 */

interface Lane {
  id: string;
  originCountry: string;
  destCountry: string;
  mode: string;
  transitDays: number | null;
}

interface CountryOption {
  code: string;
  name: string;
}

const MODES = [
  { value: "roro", label: "RO-RO (driven on board)" },
  { value: "container_fcl", label: "Container — full (FCL)" },
  { value: "container_lcl", label: "Container — shared (LCL)" },
  { value: "air", label: "Air freight" },
];

export function LaneManager({
  orgId,
  lanes,
  origins,
  destinations,
}: {
  orgId: string;
  lanes: Lane[];
  origins: CountryOption[];
  destinations: CountryOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [originCountry, setOriginCountry] = useState(origins[0]?.code ?? "AE");
  const [destCountry, setDestCountry] = useState(destinations[0]?.code ?? "");
  const [mode, setMode] = useState("roro");
  const [transitDays, setTransitDays] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!destCountry) {
      toast.error("Choose a destination.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/freight/lanes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          originCountry,
          destCountry,
          mode,
          transitDays: transitDays ? Number(transitDays) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Lane added.");
      setOpen(false);
      setTransitDays("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add lane.");
    } finally {
      setBusy(false);
    }
  };

  const nameOf = (code: string) =>
    [...origins, ...destinations].find((c) => c.code === code)?.name ?? code;

  return (
    <div className="rounded-xl border border-[#E5E5EA] bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[#E5E5EA] px-4 py-3">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-[#8136B2]" />
          <div>
            <h3 className="text-xs font-bold text-[#141414]">Lanes you serve</h3>
            <p className="text-[11px] text-muted">
              You only receive requests matching these routes.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E5EA] text-[11px] font-semibold text-[#141414] hover:bg-[#F4F4F6] transition-colors flex-shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add lane
        </button>
      </div>

      {open && (
        <div className="border-b border-[#E5E5EA] bg-[#F4F4F6] p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <label className="block">
              <span className="text-[11px] font-semibold text-[#141414]">From</span>
              <select
                value={originCountry}
                onChange={(e) => setOriginCountry(e.target.value)}
                className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] bg-white px-2 text-xs outline-none focus:border-[#8136B2]"
              >
                {origins.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-[#141414]">To</span>
              <select
                value={destCountry}
                onChange={(e) => setDestCountry(e.target.value)}
                className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] bg-white px-2 text-xs outline-none focus:border-[#8136B2]"
              >
                {destinations.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-[#141414]">Mode</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] bg-white px-2 text-xs outline-none focus:border-[#8136B2]"
              >
                {MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-[#141414]">
                Typical days
              </span>
              <input
                inputMode="numeric"
                value={transitDays}
                onChange={(e) => setTransitDays(e.target.value)}
                placeholder="21"
                className="mt-1 w-full h-9 rounded-lg border border-[#E5E5EA] bg-white px-2 text-xs outline-none focus:border-[#8136B2]"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={add}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 h-9 w-full sm:w-auto sm:px-6 rounded-lg bg-[#8136B2] text-white text-xs font-semibold hover:bg-[#370B55] transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save lane"}
          </button>
        </div>
      )}

      {lanes.length === 0 ? (
        <p className="px-4 py-6 text-center text-[11px] text-muted">
          No lanes yet. Add the routes you run to start receiving requests.
        </p>
      ) : (
        <ul className="divide-y divide-[#E5E5EA]">
          {lanes.map((l) => (
            <li
              key={l.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <span className="text-[11px] font-medium text-[#141414]">
                {nameOf(l.originCountry)} → {nameOf(l.destCountry)}
              </span>
              <span className="flex items-center gap-2 text-[10px] text-muted">
                <span className="rounded-full bg-[#F4F4F6] px-2 py-0.5">
                  {l.mode.replace(/_/g, " ")}
                </span>
                {l.transitDays ? (
                  <span className="tabular-nums">~{l.transitDays}d</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
