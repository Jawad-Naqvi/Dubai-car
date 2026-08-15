import { setRequestLocale } from "next-intl/server";
import { DashboardHeader } from "@/components/dashboard/header";
import { ConversationInbox } from "@/components/messages/conversation-inbox";
import { getConversationsFor } from "@/lib/data/conversations";
import {
  getDashboardRole,
  getOrSyncUser,
  getCurrentDealer,
} from "@/lib/data/users";

export const dynamic = "force-dynamic";

/**
 * One inbox for everyone. Buyers and dealers get the same chat experience —
 * enquiries and quote negotiations merged into a single history, so nobody has
 * to remember which feature a conversation started in.
 */
export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [role, user] = await Promise.all([
    getDashboardRole().catch(() => "buyer" as const),
    getOrSyncUser().catch(() => null),
  ]);
  const isSeller = role === "dealer" || role === "admin";
  const dealer = isSeller ? await getCurrentDealer().catch(() => null) : null;

  const conversations = user
    ? await getConversationsFor(
        user.id,
        isSeller ? "seller" : "buyer",
        dealer?.id,
      ).catch(() => [])
    : [];

  const needsReply = conversations.filter((c) => c.awaitingMe).length;

  return (
    <>
      <DashboardHeader
        title="Messages"
        subtitle={
          conversations.length === 0
            ? "Your conversations with buyers and sellers"
            : `${conversations.length} conversation${conversations.length === 1 ? "" : "s"}${
                needsReply ? ` · ${needsReply} awaiting your reply` : ""
              }`
        }
      />
      <main className="p-5">
        <ConversationInbox
          conversations={conversations}
          audience={isSeller ? "seller" : "buyer"}
        />
      </main>
    </>
  );
}
