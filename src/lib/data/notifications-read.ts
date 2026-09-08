import "server-only";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { getOrSyncUser } from "@/lib/data/users";

/**
 * Read side of the notification centre.
 *
 * The `notifications` table was WRITE-ONLY — the dispatcher inserted rows and
 * nothing ever selected them, while the dashboard bell rendered a hardcoded
 * purple dot that was permanently "on". So users were told they had something
 * waiting whether or not they did, and could never find out what it was.
 *
 * Everything here is scoped to the session user. No function accepts a userId
 * from a caller.
 */

export interface NotificationView {
  id: string;
  event: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: string;
}

export async function getMyNotifications(
  limit = 30,
): Promise<NotificationView[]> {
  if (!isDbEnabled()) return [];
  const user = await getOrSyncUser().catch(() => null);
  if (!user) return [];

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return rows.map((n) => ({
    id: n.id,
    event: n.event,
    title: n.title,
    body: n.body,
    href: n.href,
    read: !!n.readAt,
    createdAt: n.createdAt.toISOString(),
  }));
}

/** Unread count for the bell badge. Cheap enough to poll. */
export async function getMyUnreadNotificationCount(): Promise<number> {
  if (!isDbEnabled()) return 0;
  const user = await getOrSyncUser().catch(() => null);
  if (!user) return 0;

  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, user.id), isNull(notifications.readAt)),
    );
  return row?.n ?? 0;
}

/** Marks one notification, or all of them, as read for the session user. */
export async function markNotificationsRead(id?: string): Promise<boolean> {
  if (!isDbEnabled()) return false;
  const user = await getOrSyncUser().catch(() => null);
  if (!user) return false;

  // The userId predicate is what stops one user marking another's rows read.
  const where = id
    ? and(eq(notifications.userId, user.id), eq(notifications.id, id))
    : and(eq(notifications.userId, user.id), isNull(notifications.readAt));

  await db.update(notifications).set({ readAt: new Date() }).where(where);
  return true;
}
