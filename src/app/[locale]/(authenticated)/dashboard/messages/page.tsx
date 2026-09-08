import { DashboardHeader } from "@/components/dashboard/header";
import { ChatInbox } from "@/components/chat/chat-inbox";

export const dynamic = "force-dynamic";

/**
 * The unified inbox. One place for every conversation this account has — with
 * sellers, with buyers, and with the freight partner once a shipment is
 * booked — instead of a separate list per relationship.
 */
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;

  return (
    <>
      <DashboardHeader
        title="Messages"
        subtitle="Your conversations with sellers, buyers and freight partners"
      />
      <main className="p-5">
        <ChatInbox initialId={c} />
      </main>
    </>
  );
}
