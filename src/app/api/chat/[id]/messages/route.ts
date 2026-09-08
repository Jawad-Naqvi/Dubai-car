import { NextResponse } from "next/server";
import {
  getConversation,
  getConversationCursor,
  sendMessage,
  type MessageVisibility,
} from "@/lib/data/chat";

export const dynamic = "force-dynamic";

const VISIBILITIES: MessageVisibility[] = [
  "all_parties",
  "admin_only",
  "buyer_admin",
  "dealer_admin",
  "forwarder_admin",
];

/**
 * Reads a thread. `?cursor=1` returns only the newest message timestamp, which
 * is what the client polls — cheap enough to call every few seconds, and the
 * full thread is refetched only when the cursor actually moves.
 *
 * A non-participant gets 404, not 403, so conversation ids cannot be probed.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);

  if (url.searchParams.get("cursor") === "1") {
    const cursor = await getConversationCursor(id);
    if (cursor === null) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ cursor });
  }

  const conversation = await getConversation(id);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ conversation });
}

/** Posts a message. The sender's role comes from their participant row. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.body !== "string") {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const visibility: MessageVisibility = VISIBILITIES.includes(body.visibility)
    ? body.visibility
    : "all_parties";

  const result = await sendMessage(id, body.body, visibility);
  if (!result.ok) {
    const status = result.error === "Not allowed" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, messageId: result.messageId });
}
