"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import { ArrowLeft, Send, Loader2, ExternalLink } from "lucide-react";

interface Reply {
  senderRole: "buyer" | "dealer";
  body: string;
  createdAt: string;
}

export interface ThreadForChat {
  id: string;
  message: string;
  createdAt: string;
  listingId?: string;
  listingSlug?: string;
  listingTitle?: string;
  dealerName?: string;
  replies?: Reply[];
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now.getTime() - 86400000);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {
    day: "numeric",
    month: "long",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

/**
 * Full chat conversation rendered inline inside the account drawer. Reuses the
 * dashboard inbox look — the signed-in buyer is "me" (purple bubbles on the
 * right), the dealer/seller is the counterpart. Replies POST to the same lead
 * reply endpoint the dashboard uses.
 */
export function AccountThreadChat({
  thread,
  onBack,
}: {
  thread: ThreadForChat;
  onBack: () => void;
}) {
  const [replies, setReplies] = useState<Reply[]>(thread.replies ?? []);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // The lead's opening message is the buyer's first message, then any replies.
  const messages: Reply[] = [
    { senderRole: "buyer", body: thread.message, createdAt: thread.createdAt },
    ...replies,
  ];

  // Keep the transcript pinned to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [replies.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/leads/${thread.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send");
      setReplies((r) => [
        ...r,
        { senderRole: "buyer", body: text, createdAt: new Date().toISOString() },
      ]);
      setDraft("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Chat header */}
      <div className="p-3 border-b border-[#E5E5EA] flex items-center gap-2.5">
        <button
          onClick={onBack}
          aria-label="Back to messages"
          className="p-1 -ms-1 rounded-lg hover:bg-[#F4F4F6]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="h-9 w-9 rounded-full bg-[#370B55] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {(thread.dealerName ?? "Seller").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-[#141414] truncate">
            {thread.dealerName ?? "Seller"}
          </div>
          <div className="text-[11px] text-[#63666A] truncate">
            {thread.listingTitle ?? "Listing"}
          </div>
        </div>
        {thread.listingId && (
          <Link
            href={`/listings/${thread.listingId}/${thread.listingSlug ?? ""}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#141414] hover:opacity-70 flex-shrink-0"
          >
            View car
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#FAFAFB]"
      >
        <div className="flex justify-center">
          <span className="rounded-full bg-white border border-[#E5E5EA] px-2.5 py-0.5 text-[10px] text-muted">
            {dayLabel(thread.createdAt)}
          </span>
        </div>
        {messages.map((m, i) => {
          const mine = m.senderRole === "buyer";
          return (
            <div
              key={i}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                  mine
                    ? "bg-[#8136B2] text-white rounded-br-sm"
                    : "bg-white border border-[#E5E5EA] text-[#141414] rounded-bl-sm"
                }`}
              >
                <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                  {m.body}
                </p>
                <div
                  className={`mt-1 text-[9px] text-end ${
                    mine ? "text-white/60" : "text-muted"
                  }`}
                >
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-[#E5E5EA] flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Write a message…"
          className="flex-1 resize-none rounded-2xl border border-[#D9D9E0] px-3 py-2.5 text-xs max-h-32 focus:outline-none focus:border-[#8136B2] focus:ring-1 focus:ring-[#8136B2]"
        />
        <button
          onClick={send}
          disabled={sending || !draft.trim()}
          aria-label="Send"
          className="h-10 w-10 rounded-full bg-[#8136B2] text-white grid place-items-center flex-shrink-0 disabled:opacity-50"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
