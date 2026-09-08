import { NextResponse } from "next/server";
import { getMyConversations, getUnreadTotal } from "@/lib/data/chat";

export const dynamic = "force-dynamic";

/**
 * The signed-in user's inbox. Every thread they participate in — with any
 * number of different vendors — in one list, newest first.
 */
export async function GET() {
  const [conversations, unread] = await Promise.all([
    getMyConversations(),
    getUnreadTotal(),
  ]);
  return NextResponse.json({ conversations, unread });
}
