"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

const KEY = "dxb:compare";
const EVENT = "dxb:compare-changed";
export const MAX_COMPARE = 3;

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

/** Broadcast so every compare button / tray instance stays in sync. */
function broadcast(ids: string[]) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { ids } }));
}

/**
 * Compare tray.
 *  - Signed in  → persisted to the user's account (DB) via /api/compare, so the
 *    tray follows them across devices. Any local (signed-out) picks are merged
 *    in on first login, then localStorage is cleared.
 *  - Signed out → localStorage, so comparing still works before sign-up.
 */
export function useCompare() {
  const { isLoaded, isSignedIn } = useAuth();
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;

    if (isSignedIn) {
      (async () => {
        try {
          const local = read();
          if (local.length) {
            await fetch("/api/compare", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ merge: local }),
            });
            writeLocal([]);
          }
          const res = await fetch("/api/compare");
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
      if (!has && ids.length >= MAX_COMPARE) {
        toast.error(`You can compare up to ${MAX_COMPARE} cars.`);
        return;
      }
      const next = has ? ids.filter((x) => x !== id) : [...ids, id];
      setIds(next);
      broadcast(next);
      if (!has) toast.success("Added to compare");

      if (isSignedIn) {
        if (has) {
          fetch(`/api/compare?listingId=${encodeURIComponent(id)}`, {
            method: "DELETE",
          }).catch(() => {});
        } else {
          fetch("/api/compare", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId: id }),
          }).catch(() => {});
        }
      } else {
        writeLocal(next);
      }
    },
    [ids, isSignedIn],
  );

  const clear = useCallback(() => {
    setIds([]);
    broadcast([]);
    if (isSignedIn) {
      fetch("/api/compare?all=1", { method: "DELETE" }).catch(() => {});
    } else {
      writeLocal([]);
    }
  }, [isSignedIn]);

  const isComparing = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, count: ids.length, toggle, clear, isComparing };
}
