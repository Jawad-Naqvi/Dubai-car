import { DashboardHeader } from "@/components/dashboard/header";
import { LeadsInbox } from "@/components/dashboard/leads-inbox";
import { getLeadsForDealer } from "@/lib/data/leads";
import { getCurrentDealer, getOrSyncUser } from "@/lib/data/users";

export default async function LeadsPage() {
  // Scope to whoever is signed in: a dealership by its dealer record, a
  // private seller by their own listings. Never call this unscoped.
  const [dealer, user] = await Promise.all([
    getCurrentDealer().catch(() => null),
    getOrSyncUser().catch(() => null),
  ]);
  const leads = await getLeadsForDealer(dealer?.id, user?.id);
  const totalFees = leads.reduce((acc, l) => acc + l.feeAED, 0);

  return (
    <>
      <DashboardHeader
        title="Leads inbox"
        subtitle={`${leads.length} leads · AED ${totalFees.toLocaleString()} in lead fees`}
      />
      <LeadsInbox leads={leads} />
    </>
  );
}
