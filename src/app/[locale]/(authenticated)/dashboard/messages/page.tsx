import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { ReplyThread } from "@/components/dashboard/reply-thread";
import { getMessagesForUser } from "@/lib/data/leads";
import { getOrSyncUser } from "@/lib/data/users";
import { MessageSquare, Search } from "lucide-react";

export const dynamic = "force-dynamic";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_CHIP: Record<string, string> = {
  new: "bg-[#1B4FA0]/10 text-[#1B4FA0]",
  contacted: "bg-[#8136B2]/10 text-[#6B21A8]",
  closed: "bg-[#F4F4F6] text-secondary",
};

const TYPE_LABELS: Record<string, string> = {
  inquiry: "Message",
  contact_unlock: "Contact unlock",
  test_drive: "Test drive",
  export_inquiry: "Export",
};

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getOrSyncUser().catch(() => null);
  const messages = user
    ? await getMessagesForUser(user.id).catch(() => [])
    : [];

  return (
    <>
      <DashboardHeader
        title="Messages"
        subtitle={`${messages.length} ${messages.length === 1 ? "thread" : "threads"}`}
      />
      <main className="p-5 lg:p-8">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 rounded-2xl bg-white border border-[#E5E5EA] shadow-card">
            <MessageSquare className="h-8 w-8 text-muted mb-3" />
            <h3 className="text-sm font-semibold">No messages yet</h3>
            <p className="mt-1 text-xs text-muted max-w-xs">
              When you inquire on a listing, your conversation with the seller
              shows up here.
            </p>
            <Button asChild variant="gold" size="md" className="mt-5">
              <Link href="/buy">
                <Search className="h-4 w-4" />
                Browse inventory
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl bg-white border border-[#E5E5EA] shadow-card p-4 hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {m.listingTitle ?? "Listing"}
                    </div>
                    {m.dealerName && (
                      <div className="text-[11px] text-muted mt-0.5">
                        {m.dealerName}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        STATUS_CHIP[m.status] ?? "bg-[#F4F4F6] text-secondary"
                      }`}
                    >
                      {m.status}
                    </span>
                    <span className="text-[10px] text-muted">
                      {timeAgo(m.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xs text-secondary line-clamp-2">
                  {m.message || "—"}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#F4F4F6] text-secondary">
                    {TYPE_LABELS[m.type] ?? m.type}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-[#E5E5EA]">
                  <ReplyThread leadId={m.id} replies={m.replies} senderRole="buyer" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
