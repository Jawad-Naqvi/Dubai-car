"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Conversation, ChatMessage } from "@/lib/data/conversations";
import {
  Search,
  Send,
  Layers,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Car,
  ExternalLink,
} from "lucide-react";

type Filter = "all" | "enquiry" | "quote" | "unreplied";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "enquiry", label: "Enquiries" },
  { key: "quote", label: "Quotes" },
  { key: "unreplied", label: "Needs reply" },
];

function timeShort(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now.getTime() - 86400000);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (days < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
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

/** Group consecutive messages by calendar day for the date separators. */
function groupByDay(messages: ChatMessage[]) {
  const groups: { day: string; items: ChatMessage[] }[] = [];
  for (const m of messages) {
    const label = dayLabel(m.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === label) last.items.push(m);
    else groups.push({ day: label, items: [m] });
  }
  return groups;
}

/**
 * Unified chat inbox — one place for every conversation a user has on the
 * marketplace, whether it started as an enquiry on a car or a bulk quotation.
 * Same component serves buyers and dealers; `audience` flips which side of the
 * thread is "me".
 */
export function ConversationInbox({
  conversations: initial,
  audience,
}: {
  conversations: Conversation[];
  audience: "buyer" | "seller";
}) {
  const [conversations, setConversations] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(
    initial[0]?.id ?? null,
  );
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const myRole = audience === "buyer" ? "buyer" : "dealer";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => {
      if (filter === "enquiry" && c.kind !== "enquiry") return false;
      if (filter === "quote" && c.kind !== "quote") return false;
      if (filter === "unreplied" && !c.awaitingMe) return false;
      if (
        q &&
        !`${c.counterpartName} ${c.subject} ${c.reference ?? ""} ${c.lastMessage}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [conversations, filter, query]);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const needsReply = conversations.filter((c) => c.awaitingMe).length;

  // Keep the transcript pinned to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [active?.id, active?.messages.length]);

  const send = async () => {
    const text = draft.trim();
    if (!active || !text) return;
    setSending(true);
    try {
      const url =
        active.kind === "quote"
          ? `/api/quotes/${active.refId}/messages`
          : `/api/leads/${active.refId}/reply`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send");

      const sent: ChatMessage = {
        id: `local-${Date.now()}`,
        senderRole: myRole,
        body: text,
        createdAt: new Date().toISOString(),
      };
      setConversations((list) =>
        list.map((c) =>
          c.id === active.id
            ? {
                ...c,
                messages: [...c.messages, sent],
                lastMessage: text,
                lastAt: sent.createdAt,
                awaitingMe: false,
              }
            : c,
        ),
      );
      setDraft("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send message");
    } finally {
      setSending(false);
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="rounded-lg bg-white border border-[#E5E5EA] p-12 text-center">
        <MessageSquare className="h-8 w-8 text-muted mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-[#141414]">
          No conversations yet
        </h3>
        <p className="mt-1 text-xs text-muted max-w-sm mx-auto leading-relaxed">
          {audience === "buyer"
            ? "Message a seller from any listing, or request a bulk quote — every conversation lands here."
            : "Buyer enquiries and quote negotiations both appear here as chats."}
        </p>
        {audience === "buyer" && (
          <Button asChild variant="gold" size="md" className="mt-5">
            <Link href="/buy">Browse cars</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white border border-[#E5E5EA] overflow-hidden grid grid-cols-1 lg:grid-cols-[320px_1fr] h-[calc(100vh-190px)] min-h-[520px]">
      {/* ---------------------------------------------- Conversation list */}
      <div
        className={cn(
          "flex flex-col border-e border-[#E5E5EA] min-h-0",
          // On mobile the list hides once a chat is open
          active ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="p-3 border-b border-[#E5E5EA] space-y-2">
          <div className="flex items-center gap-1.5 bg-[#F4F4F6] rounded-full px-3 h-9">
            <Search className="h-3.5 w-3.5 text-muted flex-shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations"
              className="flex-1 bg-transparent text-xs outline-none min-w-0"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "h-6 px-2.5 rounded-full text-[10px] font-medium transition-colors",
                  filter === f.key
                    ? "bg-[#141414] text-white"
                    : "bg-[#F4F4F6] text-secondary hover:text-[#141414]",
                )}
              >
                {f.label}
                {f.key === "unreplied" && needsReply > 0 && (
                  <span className="ms-1 text-[#AB74CF]">{needsReply}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#E5E5EA]">
          {visible.length === 0 && (
            <p className="p-6 text-center text-xs text-muted">
              No conversations match.
            </p>
          )}
          {visible.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                "w-full text-left p-3 flex gap-2.5 transition-colors",
                active?.id === c.id ? "bg-[#F3EDF9]" : "hover:bg-[#F4F4F6]",
              )}
            >
              <div
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                  c.kind === "quote" ? "bg-[#8136B2]" : "bg-[#370B55]",
                )}
              >
                {c.counterpartName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#141414] truncate">
                    {c.counterpartName}
                  </span>
                  <span className="text-[10px] text-muted flex-shrink-0">
                    {timeShort(c.lastAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {c.kind === "quote" ? (
                    <Layers className="h-2.5 w-2.5 text-[#8136B2] flex-shrink-0" />
                  ) : (
                    <Car className="h-2.5 w-2.5 text-muted flex-shrink-0" />
                  )}
                  <span className="text-[10px] text-[#63666A] truncate">
                    {c.subject}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-[11px] text-muted truncate">
                    {c.lastMessage.replace(/\n/g, " ")}
                  </span>
                  {c.awaitingMe && (
                    <span className="h-2 w-2 rounded-full bg-[#8136B2] flex-shrink-0" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------- Transcript */}
      {active ? (
        <div className="flex flex-col min-h-0">
          {/* Chat header */}
          <div className="p-3 border-b border-[#E5E5EA] flex items-center gap-2.5">
            <button
              onClick={() => setActiveId(null)}
              className="lg:hidden p-1 -ms-1 rounded-lg hover:bg-[#F4F4F6]"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                active.kind === "quote" ? "bg-[#8136B2]" : "bg-[#370B55]",
              )}
            >
              {active.counterpartName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-[#141414] truncate">
                {active.counterpartName}
              </div>
              <div className="text-[11px] text-[#63666A] truncate">
                {active.subject}
                {active.reference ? ` · ${active.reference}` : ""}
                {active.quantity ? ` · ${active.quantity} units` : ""}
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center rounded-full bg-[#F4F4F6] px-2 py-0.5 text-[10px] font-semibold text-[#63666A] flex-shrink-0">
              {active.statusLabel}
            </span>
            {active.kind === "quote" ? (
              <Link
                href="/dashboard/quotes"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#141414] hover:opacity-70"
              >
                Open quote
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : active.listingId ? (
              <Link
                href={`/listings/${active.listingId}/${active.listingSlug ?? ""}`}
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#141414] hover:opacity-70"
              >
                View car
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : null}
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAFAFB]"
          >
            {groupByDay(active.messages).map((group) => (
              <div key={group.day} className="space-y-2">
                <div className="flex justify-center">
                  <span className="rounded-full bg-white border border-[#E5E5EA] px-2.5 py-0.5 text-[10px] text-muted">
                    {group.day}
                  </span>
                </div>
                {group.items.map((m) => {
                  const mine = m.senderRole === myRole;
                  return (
                    <div
                      key={m.id}
                      className={cn("flex", mine ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] sm:max-w-[70%] rounded-2xl px-3 py-2",
                          mine
                            ? "bg-[#8136B2] text-white rounded-br-sm"
                            : "bg-white border border-[#E5E5EA] text-[#141414] rounded-bl-sm",
                        )}
                      >
                        <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                          {m.body}
                        </p>
                        <div
                          className={cn(
                            "mt-1 text-[9px] text-end",
                            mine ? "text-white/60" : "text-muted",
                          )}
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
            ))}
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
            <Button
              variant="gold"
              size="md"
              className="rounded-full flex-shrink-0"
              disabled={sending || !draft.trim()}
              onClick={send}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-col items-center justify-center text-center p-10">
          <MessageSquare className="h-8 w-8 text-muted mb-3" />
          <p className="text-xs text-muted">
            Pick a conversation to read the full history.
          </p>
        </div>
      )}
    </div>
  );
}
