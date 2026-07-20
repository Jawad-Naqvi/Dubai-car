"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import { Bell, Plus, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Frequency = "instant" | "daily" | "weekly";

interface SavedSearch {
  id: string;
  name: string;
  query: Record<string, string>;
  queryString: string;
  frequency: Frequency;
  createdAt: string;
}

const FREQUENCY_LABELS: Record<Frequency, string> = {
  instant: "Instant",
  daily: "Daily digest",
  weekly: "Weekly digest",
};

/** Human summary of a stored query for the alert card. */
function describe(query: Record<string, string>): string {
  const parts: string[] = [];
  if (query.q) parts.push(`“${query.q}”`);
  if (query.make) parts.push(query.make);
  if (query.model) parts.push(query.model);
  if (query.bodyType) parts.push(query.bodyType);
  if (query.emirate) parts.push(query.emirate);
  if (query.priceMax) parts.push(`≤ AED ${Number(query.priceMax).toLocaleString()}`);
  if (query.yearMin) parts.push(`${query.yearMin}+`);
  return parts.join(" · ") || "All cars";
}

export function AlertsManager() {
  const [alerts, setAlerts] = useState<SavedSearch[] | null>(null);
  const [name, setName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/saved-searches")
      .then((r) => r.json())
      .then((d) => setAlerts(d.searches ?? []))
      .catch(() => setAlerts([]));
  }, []);

  const addAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Give your alert a name");
      return;
    }
    setSaving(true);
    try {
      const query: Record<string, string> = {};
      if (keyword.trim()) query.q = keyword.trim();
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, query, frequency }),
      });
      if (res.status === 401) {
        toast.error("Please sign in to create alerts.");
        return;
      }
      const d = await res.json();
      setAlerts(d.searches ?? []);
      setName("");
      setKeyword("");
      setFrequency("daily");
      toast.success("Alert created — we'll email you new matches");
    } catch {
      toast.error("Could not create alert. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const removeAlert = async (id: string) => {
    // optimistic
    setAlerts((cur) => (cur ? cur.filter((a) => a.id !== id) : cur));
    try {
      const res = await fetch(`/api/saved-searches?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const d = await res.json().catch(() => null);
      if (d?.searches) setAlerts(d.searches);
      toast.success("Alert removed");
    } catch {
      toast.error("Could not remove alert.");
    }
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="BMW under 200k"
              className="w-full h-9 rounded-full border border-[#E7E4DA] bg-white px-4 text-xs outline-none focus:border-[#F0941F]"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted mb-1">
              Keyword (optional)
            </label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
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
          <Button type="submit" variant="gold" size="md" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create alert
          </Button>
          <p className="text-[10px] text-muted leading-relaxed">
            Tip: on the Buy page, set your filters then tap “Save search” to alert
            on the exact search.
          </p>
        </form>
      </div>

      {/* Existing alerts */}
      <div className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-5">
        <h2 className="text-xs font-semibold mb-4">
          Your alerts{" "}
          <span className="text-muted font-normal">({alerts?.length ?? 0})</span>
        </h2>
        {alerts === null ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 text-muted animate-spin" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <Bell className="h-7 w-7 text-muted mb-3" />
            <h3 className="text-sm font-semibold">No alerts yet</h3>
            <p className="mt-1 text-xs text-muted max-w-xs">
              Create an alert to get emailed when matching cars are listed.
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
                  <div className="font-semibold text-xs truncate">{a.name}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#F3F1E9] text-secondary">
                      {FREQUENCY_LABELS[a.frequency]}
                    </span>
                    <span className="truncate">{describe(a.query)}</span>
                  </div>
                </div>
                <Link
                  href={`/buy${a.queryString ? `?${a.queryString}` : ""}`}
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
