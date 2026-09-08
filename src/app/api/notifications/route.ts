import { NextResponse } from "next/server";
import {
  getMyNotifications,
  getMyUnreadNotificationCount,
  markNotificationsRead,
} from "@/lib/data/notifications-read";

export const dynamic = "force-dynamic";

/**
 * The signed-in user's notification centre.
 * `?count=1` returns only the badge number — cheap enough for the bell to poll.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("count") === "1") {
    return NextResponse.json({ unread: await getMyUnreadNotificationCount() });
  }
  const [items, unread] = await Promise.all([
    getMyNotifications(30),
    getMyUnreadNotificationCount(),
  ]);
  return NextResponse.json({ notifications: items, unread });
}

/** Marks one notification read, or all of them when no id is given. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : undefined;
  const ok = await markNotificationsRead(id);
  if (!ok) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  return NextResponse.json({ ok: true });
}
