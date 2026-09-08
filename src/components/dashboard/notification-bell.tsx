"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "@/i18n/routing";
import { Bell, Check, Loader2, Inbox } from "lucide-react";

/**
 * A notification bell that tells the truth.
 *
 * The previous bell was a link to the leads inbox with a permanently-lit
 * purple dot — it reported unread items whether or not any existed, and there
 * was no way to see what they were. This reads the real notification table,
 * shows a real count, and lets the user open or dismiss each item.
 *
 * The panel is portalled to <body>: the dashboard header uses backdrop-blur,
 * and an ancestor with backdrop-filter becomes the containing block for fixed
 * descendants, which would clip the dropdown to the header strip.
 */

interface NotificationRow {
  id: string;
  event: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: string;
}

const POLL_MS = 60_000;

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(
    null,
  );

  const loadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?count=1");
      if (!res.ok) return;
      const data = await res.json();
      setUnread(data.unread ?? 0);
    } catch {
      /* a dropped poll is harmless */
    }
  }, []);

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    loadCount();
    const tick = () => {
      if (document.visibilityState === "visible") loadCount();
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [loadCount]);

  // Close on Escape / outside click.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = () => {
    if (!open) {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        setAnchor({
          top: rect.bottom + 8,
          right: Math.max(8, window.innerWidth - rect.right),
        });
      }
      setItems(null);
      loadItems();
    }
    setOpen((v) => !v);
  };

  const markAll = async () => {
    setBusy(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setUnread(0);
      setItems((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null);
    } finally {
      setBusy(false);
    }
  };

  const openItem = async (n: NotificationRow) => {
    if (!n.read) {
      fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      }).catch(() => {});
      setUnread((u) => Math.max(0, u - 1));
    }
    setOpen(false);
    if (n.href) router.push(n.href);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggle}
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        aria-expanded={open}
        className="relative h-8 w-10 rounded-full bg-[#F4F4F6] border border-[#E5E5EA] flex items-center justify-center hover:border-[#141414]/20 transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#8136B2] text-white text-[10px] font-bold grid place-items-center tabular-nums">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open &&
        anchor &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[80]"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-label="Notifications"
              style={{ top: anchor.top, right: anchor.right }}
              className="fixed z-[81] w-[min(360px,calc(100vw-16px))] rounded-xl border border-[#E5E5EA] bg-white shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[#E5E5EA] px-3 py-2.5">
                <h2 className="text-xs font-bold text-[#141414]">
                  Notifications
                </h2>
                {unread > 0 && (
                  <button
                    onClick={markAll}
                    disabled={busy}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8136B2] hover:underline disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {items === null ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-4 w-4 animate-spin text-[#8136B2]" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 px-6">
                    <Inbox className="h-6 w-6 text-muted mb-2" />
                    <p className="text-[11px] text-muted leading-relaxed">
                      Nothing yet. Enquiries, quotes, shipment updates and
                      verification decisions will show up here.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-[#E5E5EA]">
                    {items.map((n) => (
                      <li key={n.id}>
                        <button
                          onClick={() => openItem(n)}
                          className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#F4F4F6] ${
                            n.read ? "" : "bg-[#F3EDF9]/50"
                          }`}
                        >
                          <span
                            className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                              n.read ? "bg-transparent" : "bg-[#8136B2]"
                            }`}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="text-[11px] font-semibold text-[#141414] truncate">
                                {n.title}
                              </span>
                              <time className="text-[10px] text-muted flex-shrink-0">
                                {timeAgo(n.createdAt)}
                              </time>
                            </span>
                            {n.body && (
                              <span className="mt-0.5 block text-[11px] text-secondary line-clamp-2">
                                {n.body}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
