import { DashboardHeader } from "@/components/dashboard/header";
import { MyListingsView } from "@/components/dashboard/my-listings-view";
import { getSellerListings } from "@/lib/data/dashboard";
import { getOrSyncUser } from "@/lib/data/users";
import { getListingActivity } from "@/lib/data/listing-activity";

export const dynamic = "force-dynamic";

/**
 * A buyer's own "sell my car" submissions — private-seller listings scoped
 * strictly to the signed-in user (sellerId match), never a dealer's
 * inventory. See getSellerListings in src/lib/data/dashboard.ts.
 */
export default async function MyListingsPage() {
  const user = await getOrSyncUser().catch(() => null);
  const rows = user ? await getSellerListings(user.id).catch(() => []) : [];
  // Everything buyers have done to these cars, rolled up per listing.
  const activity = await getListingActivity(rows.map((r) => r.id)).catch(() => ({}));
  const active = rows.filter((r) => r.status === "active").length;
  const pending = rows.filter((r) => r.status === "pending_review").length;

  return (
    <>
      <DashboardHeader
        title="My listings"
        subtitle={
          rows.length === 0
            ? "Cars you've listed for sale yourself"
            : `${rows.length} listing${rows.length === 1 ? "" : "s"} · ${active} active · ${pending} pending review`
        }
      />
      <MyListingsView rows={rows} activity={activity} />
    </>
  );
}
