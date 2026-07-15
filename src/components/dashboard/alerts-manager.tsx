"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, Plus, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Alerts are persisted per-browser in localStorage for now. Server-side email
// delivery is a future wire-up: the `saved_searches` table already exists to
// hold these (name + query jsonb + alertFrequency) once the notification worker
// lands. Swap the persistence layer here without touching the page.
const STORAGE_KEY = "dxb:alerts";

type Frequency = "instant" | "daily" | "weekly";

interface Alert {
  id: string;
  label: string;
  query: string;
  frequency: Frequency;
}

const FREQUENCY_LABELS: Record<Frequency, string> = {
  instant: "Instant",
  daily: "Daily digest",
  weekly: "Weekly digest",
};

export function AlertsManager() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [label, setLabel] = useState("");
  const [query, setQuery] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("daily");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAlerts(JSON.parse(raw) as Alert[]);
    } catch {
      /* corrupted storage — start empty */
    }
  }, []);

  const persist = (next: Alert[]) => {
    setAlerts(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  };

  const addAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) {
      toast.error("Give your alert a name");
      return;
    }
    const next: Alert = {
      id: `AL-${Date.now()}`,
      label: trimmed,
      query: query.trim(),
      frequency,
    };
    persist([next, ...alerts]);
    setLabel("");
    setQuery("");
    setFrequency("daily");
    toast.success("Alert created");
  };

  const removeAlert = (id: string) => {
    persist(alerts.filter((a) => a.id !== id));
    toast.success("Alert removed");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
      {/* Create form */}
      <div className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-5 h-fit">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-4 w-4 text-[#F0941F]" />
          <h2 className="text-xs font-semibold">New alert</h2>
        </div>
        <form onSubmit={addAlert} className="space-y-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted mb-1">
              Alert name
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="BMW under 200k"
              className="w-full h-9 rounded-full border border-[#E7E4DA] bg-white px-4 text-xs outline-none focus:border-[#F0941F]"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted mb-1">
              Keyword (optional)
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. X5, Land Cruiser"
              className="w-full h-9 rounded-full border border-[#E7E4DA] bg-white px-4 text-xs outline-none focus:border-[#F0941F]"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted mb-1">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
              className="w-full h-9 rounded-full border border-[#E7E4DA] bg-white px-4 text-xs outline-none focus:border-[#F0941F]"
            >
              <option value="instant">Instant</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </div>
          <Button type="submit" variant="gold" size="md" className="w-full">
            <Plus className="h-4 w-4" />
            Create alert
          </Button>
        </form>
      </div>

      {/* Existing alerts */}
      <div className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-5">
        <h2 className="text-xs font-semibold mb-4">
          Your alerts{" "}
          <span className="text-muted font-normal">({alerts.length})</span>
        </h2>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <Bell className="h-7 w-7 text-muted mb-3" />
            <h3 className="text-sm font-semibold">No alerts yet</h3>
            <p className="mt-1 text-xs text-muted max-w-xs">
              Create an alert to get notified when matching cars are listed.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-[#E7E4DA] p-3 hover:bg-[#F1EFE9]"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs truncate">{a.label}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#F3F1E9] text-secondary">
                      {FREQUENCY_LABELS[a.frequency]}
                    </span>
                    {a.query && <span className="truncate">“{a.query}”</span>}
                  </div>
                </div>
                <Link
                  href={`/buy${a.query ? `?q=${encodeURIComponent(a.query)}` : ""}`}
                  className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#141414] hover:opacity-70"
                >
                  Browse matches
                  <ArrowRight className="h-3 w-3 rtl-flip" />
                </Link>
                <button
                  onClick={() => removeAlert(a.id)}
                  aria-label="Remove alert"
                  className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-muted hover:bg-[#DC2626]/10 hover:text-[#DC2626]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
