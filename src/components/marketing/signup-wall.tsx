import { Link } from "@/i18n/routing";
import { Lock } from "lucide-react";

/**
 * Login wall shown to guests below a capped public list (cars / dealers).
 * The visible items above stay server-rendered (crawlable for SEO); this card
 * gates the remainder behind a free account. Both CTAs carry a `redirect_url`
 * so the user returns to the exact same view (filters intact) after auth.
 */
export function SignupWall({
  remaining,
  total,
  label,
  redirectTo,
}: {
  remaining: number;
  total: number;
  label: string;
  redirectTo: string;
}) {
  return (
    <div className="relative mt-5">
      {/* Fade hint that more content sits behind the wall. */}
      <div className="pointer-events-none absolute -top-20 left-0 right-0 h-20 bg-gradient-to-b from-transparent to-white" />

      <div className="rounded-2xl border border-[#E5E5EA] bg-gradient-to-br from-[#F7F3FB] to-white p-8 text-center shadow-card">
        <div className="mx-auto h-11 w-11 rounded-full bg-[#8136B2]/10 flex items-center justify-center">
          <Lock className="h-5 w-5 text-[#8136B2]" />
        </div>
        <h3 className="mt-3 text-base font-bold text-[#141414]">
          {remaining.toLocaleString()} more {label} available
        </h3>
        <p className="mt-1 text-xs text-[#63666A] max-w-sm mx-auto">
          Create a free account to see all {total.toLocaleString()} {label}, save
          your favourites, and contact sellers directly.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <Link
            href={{ pathname: "/sign-up", query: { redirect_url: redirectTo } }}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#141414] px-6 text-sm font-semibold text-white hover:bg-[#141414]/90 transition-colors"
          >
            Sign up free
          </Link>
          <Link
            href={{ pathname: "/sign-in", query: { redirect_url: redirectTo } }}
            className="inline-flex h-10 items-center justify-center rounded-full border border-[#141414]/20 px-6 text-sm font-semibold text-[#141414] hover:bg-[#F4F4F6] transition-colors"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-3 text-[10px] text-muted">
          No credit card. Free forever for buyers.
        </p>
      </div>
    </div>
  );
}
