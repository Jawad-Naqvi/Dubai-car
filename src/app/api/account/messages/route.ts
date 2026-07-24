import { NextResponse } from "next/server";
import { getMessagesForUser } from "@/lib/data/leads";
import { getOrSyncUser } from "@/lib/data/users";

/** GET /api/account/messages → the signed-in buyer's message threads. */
export async function GET() {
  const user = await getOrSyncUser().catch(() => null);
  if (!user) return NextResponse.json({ threads: [] });
  const threads = await getMessagesForUser(user.id).catch(() => []);
  return NextResponse.json({ threads });
}
