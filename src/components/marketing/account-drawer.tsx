"use client";

import { Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@/i18n/routing";
import { useSavedListings } from "@/lib/saved-listings";
import { SellWizard } from "@/components/sell/sell-wizard";
import { formatAED } from "@/lib/utils";
import { X, Heart, Bell, MessageSquare, Tag, Loader2, Search } from "lucide-react";

export type AccountView = "saved" | "alerts" | "messages" | "sell";

const TABS: { key: AccountView; label: string; icon: typeof Heart }[] = [
  { key: "saved", label: "Saved", icon: Heart },
  { key: "alerts", label: "Alerts", icon: Bell },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "sell", label: "Sell", icon: Tag },
];

/**
 * Slide-over account panel (cars.com/Shopify quick-view). Opens in place from
 * the account menu — Saved / Alerts / Messages / Sell all render here instead
 * of navigating to a separate dashboard page.
 */
export function AccountDrawer({
  view,
  onChangeView,
  onClose,
}: {
  view: AccountView;
  onChangeView: (v: AccountView) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  // Lock body scroll while open + portal to body (escape the nav's
  // backdrop-filter containing block so `fixed` covers the full viewport).
  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const wide = view === "sell";

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full ${
          wide ? "max-w-2xl" : "max-w-md"
        } bg-white shadow-2xl flex flex-col animate-reveal-up`}
      >
        {/* Header + tabs */}
        <div className="border-b border-[#E5E5EA]">
          <div className="flex items-center justify-between px-4 pt-4">
            <h2 className="text-sm font-bold text-[#141414]">Your account</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="h-8 w-8 rounded-full grid place-items-center text-muted hover:bg-[#F4F4F6] hover:text-[#141414]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-1 px-3 pt-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => onChangeView(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                  view === t.key
                    ? "border-[#8136B2] text-[#8136B2]"
                    : "border-transparent text-secondary hover:text-[#141414]"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {view === "saved" && <SavedView />}
          {view === "alerts" && <AlertsView />}
          {view === "messages" && <MessagesView />}
          {view === "sell" && (
            <Suspense fallback={<Centered><Loader2 className="h-5 w-5 animate-spin text-[#8136B2]" /></Centered>}>
              <SellWizard />
            </Suspense>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-center py-16">{children}</div>;
}

function Empty({ icon: Icon, title, sub, cta }: { icon: typeof Heart; title: string; sub: string; cta?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <Icon className="h-7 w-7 text-muted mb-3" />
      <h3 className="text-sm font-semibold text-[#141414]">{title}</h3>
      <p className="mt-1 text-xs text-muted max-w-xs">{sub}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

interface SavedRow {
  id: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  priceAED: number;
  imageUrl: string;
}

function SavedView() {
  const { ids, toggle } = useSavedListings();
  const [rows, setRows] = useState<SavedRow[] | null>(null);

  useEffect(() => {
    if (ids.length === 0) {
      setRows([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/listings?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setRows(d.items ?? []))
      .catch(() => !cancelled && setRows([]));
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (rows === null) return <Centered><Loader2 className="h-5 w-5 animate-spin text-[#8136B2]" /></Centered>;
  if (rows.length === 0)
    return (
      <Empty
        icon={Heart}
        title="No saved cars yet"
        sub="Tap the heart on any car to keep it here."
        cta={
          <Link href="/buy" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-[#8136B2] text-white text-xs font-semibold">
            <Search className="h-3.5 w-3.5" /> Browse cars
          </Link>
        }
      />
    );

  return (
    <div className="p-3 space-y-2">
      {rows.map((l) => (
        <div key={l.id} className="flex items-center gap-3 rounded-lg border border-[#E5E5EA] p-2 hover:bg-[#F4F4F6]">
          <Link href={`/listings/${l.id}/${l.slug}`} className="flex items-center gap-3 min-w-0 flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.imageUrl} alt="" className="h-12 w-16 rounded-md object-cover flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#141414] truncate">
                {l.year} {l.make} {l.model}
              </div>
              <div className="text-xs text-[#8136B2] font-bold">{formatAED(l.priceAED)}</div>
            </div>
          </Link>
          <button
            onClick={() => toggle(l.id)}
            aria-label="Remove"
            className="h-7 w-7 grid place-items-center rounded-full text-[#8136B2] hover:bg-[#F3EDF9] flex-shrink-0"
          >
            <Heart className="h-4 w-4 fill-[#8136B2]" />
          </button>
        </div>
      ))}
      <Link href="/dashboard/saved" className="block text-center text-xs font-semibold text-[#8136B2] py-2 hover:underline">
        Open full saved list →
      </Link>
    </div>
  );
}

interface SavedSearch {
  id: string;
  name?: string;
  query: Record<string, string>;
}

function AlertsView() {
  const [searches, setSearches] = useState<SavedSearch[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/saved-searches")
      .then((r) => r.json())
      .then((d) => !cancelled && setSearches(d.searches ?? []))
      .catch(() => !cancelled && setSearches([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (searches === null) return <Centered><Loader2 className="h-5 w-5 animate-spin text-[#8136B2]" /></Centered>;
  if (searches.length === 0)
    return (
      <Empty
        icon={Bell}
        title="No alerts yet"
        sub="Save a search on the Buy page and get notified when new matches arrive."
        cta={
          <Link href="/buy" className="inline-flex items-center h-9 px-4 rounded-md bg-[#8136B2] text-white text-xs font-semibold">
            Set up an alert
          </Link>
        }
      />
    );

  return (
    <div className="p-3 space-y-2">
      {searches.map((s) => {
        const label = s.name || Object.values(s.query).filter(Boolean).join(" ") || "All cars";
        const q = new URLSearchParams(s.query).toString();
        return (
          <Link
            key={s.id}
            href={`/buy${q ? `?${q}` : ""}`}
            className="flex items-center gap-2.5 rounded-lg border border-[#E5E5EA] p-3 hover:bg-[#F4F4F6]"
          >
            <Bell className="h-4 w-4 text-[#8136B2] flex-shrink-0" />
            <span className="text-xs font-medium text-[#141414] truncate">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

interface Thread {
  id: string;
  message: string;
  createdAt: string;
  listingTitle?: string;
  dealerName?: string;
  status: string;
}

function MessagesView() {
  const [threads, setThreads] = useState<Thread[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/messages")
      .then((r) => r.json())
      .then((d) => !cancelled && setThreads(d.threads ?? []))
      .catch(() => !cancelled && setThreads([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (threads === null) return <Centered><Loader2 className="h-5 w-5 animate-spin text-[#8136B2]" /></Centered>;
  if (threads.length === 0)
    return (
      <Empty
        icon={MessageSquare}
        title="No messages yet"
        sub="When you inquire on a car, your conversation with the seller shows up here."
        cta={
          <Link href="/buy" className="inline-flex items-center h-9 px-4 rounded-md bg-[#8136B2] text-white text-xs font-semibold">
            Browse inventory
          </Link>
        }
      />
    );

  return (
    <div className="p-3 space-y-2">
      {threads.map((m) => (
        <Link
          key={m.id}
          href="/dashboard/messages"
          className="block rounded-lg border border-[#E5E5EA] p-3 hover:bg-[#F4F4F6]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#141414] truncate">
              {m.listingTitle ?? "Listing"}
            </span>
            <span className="text-[10px] text-muted flex-shrink-0">{m.dealerName}</span>
          </div>
          <p className="mt-1 text-[11px] text-secondary line-clamp-1">{m.message || "—"}</p>
        </Link>
      ))}
    </div>
  );
}
