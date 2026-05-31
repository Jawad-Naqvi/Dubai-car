"use client";

import { useEffect, useState, useCallback } from "react";
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

function write(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useCompare() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());
    const sync = () => setIds(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const cur = read();
    if (cur.includes(id)) {
      const next = cur.filter((x) => x !== id);
      write(next);
      setIds(next);
      return;
    }
    if (cur.length >= MAX_COMPARE) {
      toast.error(`You can compare up to ${MAX_COMPARE} cars.`);
      return;
    }
    const next = [...cur, id];
    write(next);
    setIds(next);
    toast.success("Added to compare");
  }, []);

  const clear = useCallback(() => {
    write([]);
    setIds([]);
  }, []);

  const isComparing = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, count: ids.length, toggle, clear, isComparing };
}
