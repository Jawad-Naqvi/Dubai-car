import { redirect } from "next/navigation";
import { getOrSyncUser } from "@/lib/data/users";

/**
 * Post-sign-in gateway. Dealers, B2B importers, and admins go to the
 * operational dashboard. Individuals land back on the public site to browse —
 * UNLESS they haven't verified their Emirates ID yet, in which case they're
 * sent to /verify-identity first (Emirates ID is required for every account).
 * Set as Clerk's fallbackRedirectUrl so it only fires when no explicit
 * redirect_url was requested (e.g. "sign in to reveal contact" keeps returning
 * to the listing).
 */
export default async function PostAuthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getOrSyncUser().catch(() => null);
  if (!user) redirect(`/${locale}`);
  if (
    user.role === "dealer" ||
    user.role === "b2b_importer" ||
    user.role === "admin"
  ) {
    redirect(`/${locale}/dashboard`);
  }
  // Individual (buyer role): require Emirates ID before letting them in.
  if (!user.idVerified) redirect(`/${locale}/verify-identity`);
  redirect(`/${locale}`);
}
