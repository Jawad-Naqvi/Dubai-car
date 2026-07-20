import { redirect, notFound } from "next/navigation";
import { getListingById } from "@/lib/data/listings";

/**
 * Bare `/listings/[id]` (no slug) — used by the post-sign-up redirect and any
 * short deep link. Resolves the listing and forwards to its canonical
 * `/listings/[id]/[slug]` URL (301-style) instead of 404-ing.
 */
export default async function ListingIdRedirect({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();
  redirect(`/${locale}/listings/${id}/${listing.slug}`);
}
