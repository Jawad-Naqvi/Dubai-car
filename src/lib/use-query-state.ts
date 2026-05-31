"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Patch = Record<string, string | string[] | null | undefined>;

/**
 * Small helper around the App Router search params so client controls can
 * read the current query and push partial updates without clobbering the rest.
 */
export function useQueryState() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const buildQuery = useCallback(
    (patch: Patch) => {
      const sp = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        sp.delete(key);
        if (value == null || value === "") continue;
        if (Array.isArray(value)) {
          for (const v of value) if (v) sp.append(key, v);
        } else {
          sp.set(key, value);
        }
      }
      // any filter change resets pagination
      if (!("page" in patch)) sp.delete("page");
      return sp.toString();
    },
    [params],
  );

  const push = useCallback(
    (patch: Patch) => {
      const qs = buildQuery(patch);
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [buildQuery, pathname, router],
  );

  const getAll = useCallback((key: string) => params.getAll(key), [params]);
  const get = useCallback((key: string) => params.get(key), [params]);

  return { params, get, getAll, push, buildQuery, pathname };
}
