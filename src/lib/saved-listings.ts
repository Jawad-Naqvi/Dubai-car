"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

const KEY = "dxb:saved";
const EVENT = "dxb:saved-changed";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
}

/** Broadcast the current id set so every SaveButton/instance stays in sync. */
function broadcast(ids: string[]) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { ids } }));
}

/**
 * Saved listings.
 *  - Signed in  → persisted to the user's account (DB) via /api/saved, so saves
 *    follow them across devices. Any local (signed-out) saves are merged in on
 *    first login, then localStorage is cleared.
 *  - Signed out → localStorage, so saving still works before sign-up.
 */
export function useSavedListings() {
  const { isLoaded, isSignedIn } = useAuth();
  const [ids, setIds] = useState<string[]>([]);

  // Initial load + cross-instance sync.
  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;

    if (isSignedIn) {
      (async () => {
        try {
          // One-time migration: fold any local saves into the account.
          const local = read();
          if (local.length) {
            await fetch("/api/saved", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ merge: local }),
            });
            writeLocal([]);
          }
          const res = await fetch("/api/saved");
          const data = await res.json().catch(() => ({ ids: [] }));
          if (!cancelled) setIds(data.ids ?? []);
        } catch {
          if (!cancelled) setIds([]);
        }
      })();
    } else {
      setIds(read());
    }

    const sync = (e: Event) => {
      const detail = (e as CustomEvent).detail as { ids?: string[] } | undefined;
      if (detail?.ids) setIds(detail.ids);
      else if (!isSignedIn) setIds(read());
    };
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [isLoaded, isSignedIn]);

  const toggle = useCallback(
    (id: string) => {
      const has = ids.includes(id);
      const next = has ? ids.filter((x) => x !== id) : [...ids, id];
      setIds(next);

      if (isSignedIn) {
        // Optimistic; persist to the account (best-effort, idempotent server-side).
        if (has) {
          fetch(`/api/saved?listingId=${encodeURIComponent(id)}`, {
            method: "DELETE",
          }).catch(() => {});
        } else {
          fetch("/api/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId: id }),
          }).catch(() => {});
        }
      } else {
        writeLocal(next);
      }
      broadcast(next);
    },
    [ids, isSignedIn],
  );

  const isSaved = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, count: ids.length, toggle, isSaved };
}
