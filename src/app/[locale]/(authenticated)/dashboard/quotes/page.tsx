import { DashboardHeader } from "@/components/dashboard/header";
import { QuotesWorkspace } from "@/components/quotes/quotes-workspace";
import { getQuotesForBuyer, getQuotesForDealer } from "@/lib/data/quotes";
import {
  getDashboardRole,
  getOrSyncUser,
  getCurrentDealer,
} from "@/lib/data/users";

export const dynamic = "force-dynamic";

/**
 * Quote requests. One route, two sides: a seller account sees the inbox of
 * requests to price; everyone else sees the requests they raised.
 */
export default async function QuotesPage() {
  const [role, user] = await Promise.all([
    getDashboardRole().catch(() => "buyer" as const),
    getOrSyncUser().catch(() => null),
  ]);
  const isSeller = role === "dealer" || role === "admin";

  const quotes = isSeller
    ? await getQuotesForDealer(
        (await getCurrentDealer().catch(() => null))?.id,
        user?.id,
      ).catch(() => [])
    : user
      ? await getQuotesForBuyer(user.id).catch(() => [])
      : [];

  return (
    <>
      <DashboardHeader
        title={isSeller ? "Quote requests" : "My quote requests"}
        subtitle={
          isSeller
            ? "Bulk enquiries from business buyers — respond with your pricing"
            : "Bulk pricing you've asked for, and the sellers' responses"
        }
      />
      <main className="p-5">
        <QuotesWorkspace
          quotes={quotes}
          audience={isSeller ? "seller" : "buyer"}
        />
      </main>
    </>
  );
}
