import { DashboardHeader } from "@/components/dashboard/header";
import { OrdersWorkspace } from "@/components/quotes/orders-workspace";
import { getOrdersForBuyer, getOrdersForDealer } from "@/lib/data/orders";
import {
  getDashboardRole,
  getOrSyncUser,
  getCurrentDealer,
} from "@/lib/data/users";

export const dynamic = "force-dynamic";

/**
 * Orders — where both journeys end up. Sellers run the pipeline; buyers track
 * whatever they reserved or accepted, single car or bulk.
 */
export default async function OrdersPage() {
  const [role, user] = await Promise.all([
    getDashboardRole().catch(() => "buyer" as const),
    getOrSyncUser().catch(() => null),
  ]);
  const isSeller = role === "dealer" || role === "admin";

  const orders = isSeller
    ? await getOrdersForDealer(
        (await getCurrentDealer().catch(() => null))?.id,
        user?.id,
      ).catch(() => [])
    : user
      ? await getOrdersForBuyer(user.id).catch(() => [])
      : [];

  return (
    <>
      <DashboardHeader
        title={isSeller ? "Orders" : "My orders"}
        subtitle={
          isSeller
            ? "Reservations and accepted quotes — move each one to completion"
            : "Cars you've reserved and bulk quotes you've accepted"
        }
      />
      <main className="p-5">
        <OrdersWorkspace
          orders={orders}
          audience={isSeller ? "seller" : "buyer"}
        />
      </main>
    </>
  );
}
