"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import type { LeadReplyView } from "@/lib/data/leads";

/** Inline reply thread for a lead — used on both the dealer leads inbox and the buyer messages page. */
export function ReplyThread({
  leadId,
  replies,
  senderRole,
}: {
  leadId: string;
  replies: LeadReplyView[];
  senderRole: "buyer" | "dealer";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim() }),
      });
      if (!res.ok) throw new Error();
      setText("");
      toast.success("Reply sent");
      router.refresh();
    } catch {
      toast.error("Could not send reply");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-[11px] font-semibold text-[#141414] underline underline-offset-2 hover:text-[#C97612]"
      >
        {replies.length > 0 ? `${replies.length} repl${replies.length === 1 ? "y" : "ies"}` : "Reply"}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {replies.map((r, i) => (
            <div
              key={i}
              className={`rounded-lg px-2.5 py-1.5 text-xs max-w-[85%] ${
                r.senderRole === senderRole
                  ? "bg-[#141414] text-white ms-auto"
                  : "bg-[#F3F1E9] text-secondary"
              }`}
            >
              {r.body}
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a reply…"
              className="flex-1 h-8 rounded-lg bg-white border border-[#E7E4DA] px-2.5 text-xs focus:outline-none focus:border-[#141414]/30"
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button
              type="button"
              onClick={send}
              disabled={busy || !text.trim()}
              className="h-8 w-8 flex-shrink-0 rounded-lg bg-[#141414] text-white grid place-items-center disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
