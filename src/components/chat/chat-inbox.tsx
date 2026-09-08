"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  MessageSquare,
  Loader2,
  Send,
  ArrowLeft,
  Ship,
  Car,
  FileText,
  ShieldCheck,
} from "lucide-react";

/**
 * The threaded inbox: every conversation this account has, with any number of
 * different vendors, in one list — and the thread itself alongside it.
 *
 * "Real time" here is a cursor poll, not a full refetch loop. The client asks
 * a cheap endpoint for the timestamp of the newest message every few seconds
 * and only pulls the thread when that moves. Polling backs off when the tab is
 * hidden, so a background tab costs nothing. This works on any host without a
 * websocket server, which matters because the app deploys as ordinary Next.js
 * route handlers.
 */

interface ConversationRow {
  id: string;
  kind: string;
  title: string;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadCount: number;
  counterparty: string;
}

interface ChatMessage {
  id: string;
  body: string;
  senderName: string;
  senderRole: string;
  systemEvent: string | null;
  createdAt: string;
  mine: boolean;
}

interface ConversationDetail extends ConversationRow {
  messages: ChatMessage[];
  myRole: string;
}

const ACTIVE_POLL_MS = 5000;
const IDLE_POLL_MS = 30000;

const KIND_ICON: Record<string, typeof Car> = {
  listing: Car,
  quote: FileText,
  order: FileText,
  shipment: Ship,
  support: ShieldCheck,
};

export function ChatInbox({ initialId }: { initialId?: string }) {
  const [rows, setRows] = useState<ConversationRow[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(initialId ?? null);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (!res.ok) return;
      const data = await res.json();
      setRows(data.conversations ?? []);
    } catch {
      setRows((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // Keep the list fresh so a new vendor reply surfaces without a manual reload.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") loadList();
    };
    const timer = setInterval(tick, IDLE_POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [loadList]);

  if (rows === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-[#8136B2]" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-6">
        <MessageSquare className="h-7 w-7 text-muted mb-3" />
        <h3 className="text-sm font-semibold text-[#141414]">No messages yet</h3>
        <p className="mt-1 text-xs text-muted max-w-xs leading-relaxed">
          When you contact a seller about a car, the conversation lives here —
          along with every other seller you talk to.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 min-h-[520px]">
      <div
        className={`rounded-xl border border-[#E5E5EA] bg-white overflow-hidden ${
          openId ? "hidden lg:block" : ""
        }`}
      >
        <ul className="divide-y divide-[#E5E5EA] max-h-[70vh] overflow-y-auto">
          {rows.map((row) => {
            const Icon = KIND_ICON[row.kind] ?? MessageSquare;
            const active = row.id === openId;
            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(row.id)}
                  className={`flex w-full items-start gap-3 px-3 py-3 text-left transition-colors ${
                    active ? "bg-[#F3EDF9]" : "hover:bg-[#F4F4F6]"
                  }`}
                >
                  <span className="mt-0.5 h-8 w-8 rounded-lg bg-[#F4F4F6] grid place-items-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-[#8136B2]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#141414] truncate">
                        {row.counterparty}
                      </span>
                      <span className="text-[10px] text-muted flex-shrink-0">
                        {timeAgo(row.lastMessageAt)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[11px] text-secondary truncate">
                      {row.title}
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted truncate">
                        {row.lastMessagePreview ?? "—"}
                      </span>
                      {row.unreadCount > 0 && (
                        <span className="flex-shrink-0 rounded-full bg-[#8136B2] px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
                          {row.unreadCount}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={openId ? "" : "hidden lg:block"}>
        {openId ? (
          <ChatThread
            conversationId={openId}
            onBack={() => setOpenId(null)}
            onChanged={loadList}
          />
        ) : (
          <div className="h-full rounded-xl border border-[#E5E5EA] bg-white flex items-center justify-center">
            <p className="text-xs text-muted">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatThread({
  conversationId,
  onBack,
  onChanged,
}: {
  conversationId: string;
  onBack: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/chat/${conversationId}/messages`);
    if (!res.ok) return;
    const data = await res.json();
    setDetail(data.conversation);
    const msgs: ChatMessage[] = data.conversation?.messages ?? [];
    cursorRef.current = msgs.length ? msgs[msgs.length - 1].createdAt : null;
    // Opening a thread reads it.
    fetch(`/api/chat/${conversationId}/read`, { method: "POST" })
      .then(onChanged)
      .catch(() => {});
  }, [conversationId, onChanged]);

  useEffect(() => {
    setDetail(null);
    cursorRef.current = null;
    load();
  }, [load]);

  // Cursor poll: one tiny request, refetch only when the newest message moves.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (cancelled) return;
      const hidden = document.visibilityState !== "visible";
      if (!hidden) {
        try {
          const res = await fetch(
            `/api/chat/${conversationId}/messages?cursor=1`,
          );
          if (res.ok) {
            const { cursor } = await res.json();
            if (cursor && cursor !== cursorRef.current) await load();
          }
        } catch {
          // A dropped poll is harmless; the next tick retries.
        }
      }
      timer = setTimeout(poll, hidden ? IDLE_POLL_MS : ACTIVE_POLL_MS);
    };

    timer = setTimeout(poll, ACTIVE_POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [conversationId, load]);

  // Keep the newest message in view as the thread grows.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [detail?.messages.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft("");
    try {
      const res = await fetch(`/api/chat/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
      onChanged();
    } catch (e) {
      setDraft(body); // Give the text back rather than losing it.
      toast.error(e instanceof Error ? e.message : "Could not send.");
    } finally {
      setSending(false);
    }
  };

  if (!detail) {
    return (
      <div className="h-full rounded-xl border border-[#E5E5EA] bg-white flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#8136B2]" />
      </div>
    );
  }

  return (
    <div className="flex h-full max-h-[70vh] flex-col rounded-xl border border-[#E5E5EA] bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#E5E5EA] px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="lg:hidden h-8 w-8 grid place-items-center rounded-full hover:bg-[#F4F4F6]"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-4 w-4 text-[#141414]" />
        </button>
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-[#141414] truncate">
            {detail.counterparty}
          </h3>
          <p className="text-[11px] text-muted truncate">{detail.title}</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {detail.messages.map((m) =>
          m.systemEvent ? (
            <div key={m.id} className="flex justify-center">
              <span className="rounded-full bg-[#F4F4F6] px-3 py-1 text-[10px] font-medium text-[#63666A]">
                {m.body}
              </span>
            </div>
          ) : (
            <div
              key={m.id}
              className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                  m.mine
                    ? "bg-[#8136B2] text-white rounded-br-sm"
                    : "bg-[#F4F4F6] text-[#141414] rounded-bl-sm"
                }`}
              >
                {!m.mine && (
                  <div className="text-[10px] font-semibold opacity-70 mb-0.5">
                    {m.senderName}
                  </div>
                )}
                <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                  {m.body}
                </p>
                <div
                  className={`mt-0.5 text-[10px] ${
                    m.mine ? "text-white/60" : "text-muted"
                  }`}
                >
                  {timeAgo(m.createdAt)}
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="border-t border-[#E5E5EA] p-2 flex items-end gap-2">
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
          className="flex-1 resize-none rounded-lg border border-[#E5E5EA] px-3 py-2 text-xs outline-none focus:border-[#8136B2] max-h-24"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !draft.trim()}
          aria-label="Send message"
          className="h-9 w-9 grid place-items-center rounded-lg bg-[#8136B2] text-white hover:bg-[#370B55] transition-colors disabled:opacity-40"
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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
