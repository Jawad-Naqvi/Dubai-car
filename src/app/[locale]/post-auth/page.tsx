import { redirect } from "next/navigation";
import { getDashboardRole } from "@/lib/data/users";

/**
 * Post-sign-in gateway. Buyers land back on the public site to keep browsing
 * (like any storefront customer) — only dealers, B2B importers, and admins
 * are dropped into the operational dashboard. Set as Clerk's
 * fallbackRedirectUrl so it only fires when no explicit redirect_url was
 * requested (e.g. "sign in to reveal contact" keeps returning to the listing).
 */
export default async function PostAuthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const role = await getDashboardRole().catch(() => "buyer" as const);
  redirect(role === "buyer" ? `/${locale}` : `/${locale}/dashboard`);
}
