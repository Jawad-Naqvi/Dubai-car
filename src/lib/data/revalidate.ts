import "server-only";
import { revalidateTag } from "next/cache";

/**
 * Invalidate cached reads after a write so the change shows up immediately
 * (real-time). Wrapped in try/catch because revalidateTag throws if ever called
 * outside a request scope (e.g. the seed script) — there it's simply a no-op.
 */
export function bust(...tags: string[]) {
  for (const t of tags) {
    try {
      revalidateTag(t);
    } catch {
      /* not in a request scope — ignore */
    }
  }
}
