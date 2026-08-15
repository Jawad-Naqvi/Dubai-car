import { notFound } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { ListingEditForm } from "@/components/dashboard/listing-edit-form";
import { getEditableListing } from "@/lib/data/listing-write";
import { getOrSyncUser } from "@/lib/data/users";

export const dynamic = "force-dynamic";

/**
 * Full edit form for a listing the signed-in user owns. getEditableListing
 * enforces ownership (private seller or the dealer it belongs to) and returns
 * null otherwise, so a stranger's listing id 404s instead of loading.
 */
export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getOrSyncUser().catch(() => null);
  if (!user) notFound();

  const listing = await getEditableListing(id, user).catch(() => null);
  if (!listing) notFound();

  return (
    <>
      <DashboardHeader
        title="Edit listing"
        subtitle={`${listing.year} ${listing.make} ${listing.model}`}
      />
      <ListingEditForm listing={listing} />
    </>
  );
}
