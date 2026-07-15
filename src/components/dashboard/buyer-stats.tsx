"use client";

import { useEffect, useState } from "react";
import { Heart, Bell, MessageSquare } from "lucide-react";
import { useSavedListings } from "@/lib/saved-listings";

// Buyer overview stat tiles. Saved cars and alerts live in localStorage
// (client-only), so they're read here; the messages count is passed from the
// server page (real lead data).
export function BuyerStats({ messagesCount }: { messagesCount: number }) {
  const { count: savedCount } = useSavedListings();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dxb:alerts");
      if (raw) setAlertCount((JSON.parse(raw) as unknown[]).length);
    } catch {
      /* ignore */
    }
  }, []);

  const tiles = [
    { label: "Saved cars", value: savedCount, icon: Heart },
    { label: "Active alerts", value: alertCount, icon: Bell },
    { label: "Messages", value: messagesCount, icon: MessageSquare },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-2xl bg-white border border-[#E7E4DA] shadow-card p-5 hover:shadow-card-hover transition-shadow"
        >
          <t.icon className="h-5 w-5 text-[#F0941F]" />
          <div className="mt-4 text-base font-bold tracking-tight">{t.value}</div>
          <div className="text-xs text-muted mt-1">{t.label}</div>
        </div>
      ))}
    </div>
  );
}
