import { DashboardHeader } from "@/components/dashboard/header";
import { LeadsInbox } from "@/components/dashboard/leads-inbox";
import { getLeadsForDealer } from "@/lib/data/leads";

export default async function LeadsPage() {
  const leads = await getLeadsForDealer();
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
