import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { BidBoard } from "@/components/freight/bid-board";
import { LaneManager } from "@/components/freight/lane-manager";
import { getForwarderBidBoard, getForwarderLanes } from "@/lib/data/freight";
import { getMyOrgOfType } from "@/lib/data/orgs";
import { getDestinationCountries, getOriginCountries } from "@/lib/data/countries";
import { ShieldCheck, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * The freight partner's workspace.
 *
 * Only reachable by a member of a forwarder organization — and forwarder orgs
 * exist only by admin invitation, so there is no self-serve path into this
 * page even for a signed-in user who guesses the URL.
 */
export default async function FreightPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const org = await getMyOrgOfType("forwarder");
  if (!org) redirect(`/${locale}/dashboard`);

  const [bids, lanes, origins, destinations] = await Promise.all([
    org.isVerified ? getForwarderBidBoard(org.id) : Promise.resolve([]),
    getForwarderLanes(org.id),
    getOriginCountries(),
    getDestinationCountries(),
  ]);

  const won = bids.filter((b) => b.status === "accepted").length;
  const open = bids.filter(
    (b) => b.status === "invited" || b.status === "submitted",
  ).length;

  return (
    <>
      <DashboardHeader
        title={org.name}
        subtitle={`Freight partner · ${open} open request${open === 1 ? "" : "s"} · ${won} won`}
      />
      <main className="p-5 space-y-4">
        {!org.isVerified && (
          <div className="flex items-start gap-3 rounded-xl border border-[#B7791F]/25 bg-[#B7791F]/5 p-4">
            {org.status === "rejected" ? (
              <ShieldCheck className="h-4 w-4 text-[#DC2626] flex-shrink-0 mt-0.5" />
            ) : (
              <Clock className="h-4 w-4 text-[#8A5A12] flex-shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-semibold text-[#141414]">
                {org.status === "rejected"
                  ? "Verification needs changes"
                  : "Verification in review"}
              </h2>
              <p className="mt-1 text-[11px] text-secondary leading-relaxed">
                {org.rejectionReason ??
                  "You can set up your lanes now. We'll start sending you shipping requests once your licences are verified — usually 1–2 business days."}
              </p>
            </div>
            <a
              href={`/${locale}/onboarding/verify`}
              className="inline-flex items-center h-8 px-3 rounded-lg bg-[#141414] text-white text-[11px] font-semibold flex-shrink-0"
            >
              {org.status === "rejected" ? "Resubmit" : "View status"}
            </a>
          </div>
        )}

        <LaneManager
          orgId={org.id}
          lanes={lanes.map((l) => ({
            id: l.id,
            originCountry: l.originCountry,
            destCountry: l.destCountry,
            mode: l.mode,
            transitDays: l.transitDays,
          }))}
          origins={origins}
          destinations={destinations}
        />

        <section>
          <h2 className="mb-2 text-xs font-bold text-[#141414]">
            Shipping requests
          </h2>
          <BidBoard bids={bids} />
        </section>
      </main>
    </>
  );
}
