import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ListingActivityStrip } from "@/components/dashboard/listing-activity-strip";
import type { ListingActivity } from "@/lib/data/listing-activity";
import { PenLine, BarChart3, UserCheck } from "lucide-react";

/**
 * Shown in place of the buyer actions when the viewer owns this listing.
 * Offering "Contact seller" to the seller themselves produced conversations
 * with yourself and self-placed orders — this replaces them with the controls
 * an owner actually wants, plus what buyers have done to the car.
 */
export function OwnerPanel({
  listingId,
  activity,
}: {
  listingId: string;
  activity?: ListingActivity;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-md bg-[#F3EDF9] border border-[#8136B2]/25 px-3 py-2.5">
        <UserCheck className="h-4 w-4 text-[#6B21A8] flex-shrink-0" />
        <p className="text-xs text-[#141414]">
          <span className="font-semibold">This is your listing.</span> Buyers see
          the contact options here.
        </p>
      </div>

      <ListingActivityStrip activity={activity} />

      <div className="space-y-2">
        <Button asChild variant="gold" size="md" className="w-full">
          <Link href={`/dashboard/my-listings/${listingId}/edit`}>
            <PenLine className="h-4 w-4" />
            Edit this listing
          </Link>
        </Button>
        <Button asChild variant="ghost" size="md" className="w-full">
          <Link href="/dashboard/analytics">
            <BarChart3 className="h-4 w-4" />
            View performance
          </Link>
        </Button>
      </div>
    </div>
  );
}
