"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "dxb:notification-prefs";

interface Prefs {
  emailLeads: boolean;
  whatsappAlerts: boolean;
}

const DEFAULTS: Prefs = { emailLeads: true, whatsappAlerts: true };

/**
 * Notification preferences, persisted per-browser in localStorage.
 * No preferences backend exists yet; when one lands, swap the persistence
 * layer here without touching the settings page.
 */
export function NotificationPrefs() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) });
    } catch {
      /* corrupted storage — fall back to defaults */
    }
  }, []);

  const update = (key: keyof Prefs, label: string) => (on: boolean) => {
    const next = { ...prefs, [key]: on };
    setPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
    toast.success(`${label} ${on ? "enabled" : "disabled"}`);
  };

  return (
    <div className="space-y-3 text-sm">
      <label className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-secondary">
          <Bell className="h-3.5 w-3.5" /> Email me new leads
        </span>
        <input
          type="checkbox"
          checked={prefs.emailLeads}
          onChange={(e) => update("emailLeads", "Email lead notifications")(e.target.checked)}
          className="h-4 w-4 accent-[#F0941F]"
        />
      </label>
      <label className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-secondary">
          <Bell className="h-3.5 w-3.5" /> WhatsApp lead alerts
        </span>
        <input
          type="checkbox"
          checked={prefs.whatsappAlerts}
          onChange={(e) => update("whatsappAlerts", "WhatsApp lead alerts")(e.target.checked)}
          className="h-4 w-4 accent-[#F0941F]"
        />
      </label>
    </div>
  );
}
