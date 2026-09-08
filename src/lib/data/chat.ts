import "server-only";
import { and, desc, eq, gt, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  conversations,
  conversationParticipants,
  messages,
  organizations,
  users,
} from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { getOrSyncUser } from "@/lib/data/users";
import type { OrgType } from "@/lib/data/orgs";

/**
 * THE CONVERSATION LAYER.
 *
 * One thread per record (a listing enquiry, a quote, an order, a shipment),
 * with every party in it — not a separate inbox per pair of people. A shipment
 * involves a buyer, a dealer and a forwarder; three pairwise inboxes is
 * precisely what fragments a transaction and forces people back to WhatsApp.
 *
 * SECURITY MODEL — read this before adding a function here:
 *   1. Membership of `conversation_participants` IS the authorization. Every
 *      read and every write resolves the caller to a participant row first.
 *   2. There is NO admin shortcut and NO OPEN_DASHBOARDS bypass in this file.
 *      An admin who needs to see a thread is added as a participant, which
 *      leaves a row someone can audit. A flag that silently grants access to
 *      every private conversation is not a debugging aid, it is a backdoor.
 *   3. Per-message `visibility` narrows a message inside a shared thread, so a
 *      private word with the platform doesn't need a second thread.
 */

export type ConversationKind =
  | "listing"
  | "quote"
  | "order"
  | "shipment"
  | "support";

export type MessageVisibility =
  | "all_parties"
  | "admin_only"
  | "buyer_admin"
  | "dealer_admin"
  | "forwarder_admin";

export interface ChatMessageView {
  id: string;
  body: string;
  senderUserId: string | null;
  senderName: string;
  senderRole: OrgType;
  visibility: MessageVisibility;
  systemEvent: string | null;
  createdAt: string;
  /** True when the signed-in user wrote it — drives bubble alignment. */
  mine: boolean;
}

export interface ConversationSummary {
  id: string;
  kind: ConversationKind;
  subjectId: string | null;
  title: string;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadCount: number;
  /** The other side's display name, for the inbox row. */
  counterparty: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ChatMessageView[];
  myRole: OrgType;
}

/**
 * Which visibility levels a given party role is allowed to read. A buyer never
 * sees `dealer_admin`, and nobody but the platform sees `admin_only`.
 */
function readableVisibilities(
  role: OrgType,
  isAdmin: boolean,
): MessageVisibility[] {
  if (isAdmin) {
    return [
      "all_parties",
      "admin_only",
      "buyer_admin",
      "dealer_admin",
      "forwarder_admin",
    ];
  }
  const own: Partial<Record<OrgType, MessageVisibility>> = {
    buyer: "buyer_admin",
    dealer: "dealer_admin",
    forwarder: "forwarder_admin",
  };
  const mine = own[role];
  return mine ? ["all_parties", mine] : ["all_parties"];
}

/** The caller's participant row, or null when they are not in the thread. */
async function myParticipation(conversationId: string) {
  const user = await getOrSyncUser().catch(() => null);
  if (!user) return null;
  const rows = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, user.id),
        isNull(conversationParticipants.leftAt),
      ),
    )
    .limit(1);
  if (!rows[0]) return null;
  return { user, participant: rows[0] };
}

/**
 * Finds the thread for a record, or creates it with its participants.
 * Idempotent per (kind, subjectId) so two simultaneous enquiries on the same
 * listing converge on one conversation instead of forking the history.
 */
export async function getOrCreateConversation(input: {
  kind: ConversationKind;
  subjectId: string;
  title: string;
  participants: Array<{ userId: string; orgId?: string | null; role: OrgType }>;
}): Promise<string | null> {
  if (!isDbEnabled()) return null;

  const existing = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.kind, input.kind),
        eq(conversations.subjectId, input.subjectId),
      ),
    )
    .limit(1);

  const conversationId =
    existing[0]?.id ??
    (
      await db
        .insert(conversations)
        .values({
          kind: input.kind,
          subjectId: input.subjectId,
          title: input.title,
        })
        .returning({ id: conversations.id })
    )[0].id;

  for (const p of input.participants) {
    if (!p.userId) continue;
    await db
      .insert(conversationParticipants)
      .values({
        conversationId,
        userId: p.userId,
        orgId: p.orgId ?? null,
        partyRole: p.role,
      })
      .onConflictDoNothing();
  }

  return conversationId;
}

/**
 * The signed-in user's inbox — every thread they participate in, newest first,
 * with a real unread count. This is the WhatsApp-style list: one row per
 * counterparty conversation, no matter how many vendors they've messaged.
 */
export async function getMyConversations(): Promise<ConversationSummary[]> {
  if (!isDbEnabled()) return [];
  const user = await getOrSyncUser().catch(() => null);
  if (!user) return [];

  const rows = await db
    .select({
      conversation: conversations,
      participant: conversationParticipants,
    })
    .from(conversationParticipants)
    .innerJoin(
      conversations,
      eq(conversations.id, conversationParticipants.conversationId),
    )
    .where(
      and(
        eq(conversationParticipants.userId, user.id),
        isNull(conversationParticipants.leftAt),
      ),
    )
    .orderBy(desc(conversations.lastMessageAt))
    .limit(200);

  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.conversation.id);

  // Unread = messages after my lastReadAt that I didn't write myself.
  const unreadRows = await db
    .select({
      conversationId: messages.conversationId,
      count: sql<number>`count(*)::int`,
    })
    .from(messages)
    .innerJoin(
      conversationParticipants,
      and(
        eq(conversationParticipants.conversationId, messages.conversationId),
        eq(conversationParticipants.userId, user.id),
      ),
    )
    .where(
      and(
        inArray(messages.conversationId, ids),
        ne(messages.senderUserId, user.id),
        or(
          isNull(conversationParticipants.lastReadAt),
          gt(messages.createdAt, conversationParticipants.lastReadAt),
        ),
      ),
    )
    .groupBy(messages.conversationId);

  const unread = new Map(unreadRows.map((r) => [r.conversationId, r.count]));

  // Counterparty name: the other participants on the thread.
  const others = await db
    .select({
      conversationId: conversationParticipants.conversationId,
      name: users.name,
      email: users.email,
      orgName: organizations.name,
    })
    .from(conversationParticipants)
    .leftJoin(users, eq(users.id, conversationParticipants.userId))
    .leftJoin(
      organizations,
      eq(organizations.id, conversationParticipants.orgId),
    )
    .where(
      and(
        inArray(conversationParticipants.conversationId, ids),
        ne(conversationParticipants.userId, user.id),
      ),
    );

  const nameFor = new Map<string, string>();
  for (const o of others) {
    if (nameFor.has(o.conversationId)) continue;
    nameFor.set(
      o.conversationId,
      o.orgName || o.name || o.email || "Participant",
    );
  }

  return rows.map((r) => ({
    id: r.conversation.id,
    kind: r.conversation.kind as ConversationKind,
    subjectId: r.conversation.subjectId,
    title: r.conversation.title ?? "Conversation",
    lastMessageAt: r.conversation.lastMessageAt.toISOString(),
    lastMessagePreview: r.conversation.lastMessagePreview,
    unreadCount: unread.get(r.conversation.id) ?? 0,
    counterparty: nameFor.get(r.conversation.id) ?? "Participant",
  }));
}

/** Total unread across every thread — the notification badge. */
export async function getUnreadTotal(): Promise<number> {
  const list = await getMyConversations();
  return list.reduce((sum, c) => sum + c.unreadCount, 0);
}

/**
 * One thread with its messages. Returns null when the caller is not a
 * participant — indistinguishable from "does not exist", so a probe cannot
 * enumerate other people's conversations by guessing UUIDs.
 */
export async function getConversation(
  conversationId: string,
): Promise<ConversationDetail | null> {
  if (!isDbEnabled()) return null;

  const me = await myParticipation(conversationId);
  if (!me) return null;

  const convRows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);
  const conv = convRows[0];
  if (!conv) return null;

  const myRole = me.participant.partyRole as OrgType;
  const allowed = readableVisibilities(myRole, me.user.role === "admin");

  const rows = await db
    .select({
      message: messages,
      senderName: users.name,
      senderEmail: users.email,
      orgName: organizations.name,
    })
    .from(messages)
    .leftJoin(users, eq(users.id, messages.senderUserId))
    .leftJoin(organizations, eq(organizations.id, messages.senderOrgId))
    .where(
      and(
        eq(messages.conversationId, conversationId),
        inArray(messages.visibility, allowed),
      ),
    )
    .orderBy(messages.createdAt)
    .limit(500);

  const others = await db
    .select({ name: users.name, email: users.email, orgName: organizations.name })
    .from(conversationParticipants)
    .leftJoin(users, eq(users.id, conversationParticipants.userId))
    .leftJoin(
      organizations,
      eq(organizations.id, conversationParticipants.orgId),
    )
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        ne(conversationParticipants.userId, me.user.id),
      ),
    )
    .limit(1);

  return {
    id: conv.id,
    kind: conv.kind as ConversationKind,
    subjectId: conv.subjectId,
    title: conv.title ?? "Conversation",
    lastMessageAt: conv.lastMessageAt.toISOString(),
    lastMessagePreview: conv.lastMessagePreview,
    unreadCount: 0,
    counterparty:
      others[0]?.orgName || others[0]?.name || others[0]?.email || "Participant",
    myRole,
    messages: rows.map((r) => ({
      id: r.message.id,
      body: r.message.body,
      senderUserId: r.message.senderUserId,
      senderName:
        r.orgName || r.senderName || r.senderEmail || "Unknown",
      senderRole: r.message.senderRole as OrgType,
      visibility: r.message.visibility as MessageVisibility,
      systemEvent: r.message.systemEvent,
      createdAt: r.message.createdAt.toISOString(),
      mine: r.message.senderUserId === me.user.id,
    })),
  };
}

export type SendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

/**
 * Posts a message. Authorization is participation — the sender's party role
 * comes from their participant row, never from the request body, so nobody can
 * post as a role they don't hold.
 */
export async function sendMessage(
  conversationId: string,
  body: string,
  visibility: MessageVisibility = "all_parties",
): Promise<SendResult> {
  if (!isDbEnabled()) return { ok: false, error: "Database unavailable" };

  const trimmed = (body ?? "").trim();
  if (!trimmed) return { ok: false, error: "Message cannot be empty." };
  if (trimmed.length > 4000) {
    return { ok: false, error: "Message is too long (4000 characters max)." };
  }

  const me = await myParticipation(conversationId);
  if (!me) return { ok: false, error: "Not allowed" };

  const [row] = await db
    .insert(messages)
    .values({
      conversationId,
      senderUserId: me.user.id,
      senderOrgId: me.participant.orgId,
      senderRole: me.participant.partyRole,
      body: trimmed,
      visibility,
    })
    .returning({ id: messages.id });

  await db
    .update(conversations)
    .set({
      lastMessageAt: new Date(),
      lastMessagePreview: trimmed.slice(0, 200),
    })
    .where(eq(conversations.id, conversationId));

  // The sender has by definition read their own message.
  await db
    .update(conversationParticipants)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, me.user.id),
      ),
    );

  return { ok: true, messageId: row.id };
}

/**
 * System post — milestone updates land in the same timeline as human messages
 * so a shipment reads as one story rather than a status page plus a chat.
 */
export async function postSystemMessage(
  conversationId: string,
  body: string,
  systemEvent: string,
): Promise<void> {
  if (!isDbEnabled()) return;
  await db.insert(messages).values({
    conversationId,
    body,
    systemEvent,
    senderRole: "platform",
    visibility: "all_parties",
  });
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date(), lastMessagePreview: body.slice(0, 200) })
    .where(eq(conversations.id, conversationId));
}

/** Marks the thread read up to now for the signed-in participant. */
export async function markConversationRead(
  conversationId: string,
): Promise<boolean> {
  if (!isDbEnabled()) return false;
  const me = await myParticipation(conversationId);
  if (!me) return false;
  await db
    .update(conversationParticipants)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, me.user.id),
      ),
    );
  return true;
}

/**
 * Cursor for polling: the timestamp of the newest message the caller may see.
 * The transport polls this cheap endpoint and only refetches the thread when
 * it moves, which keeps "real time" from meaning "refetch everything on a
 * timer".
 */
export async function getConversationCursor(
  conversationId: string,
): Promise<string | null> {
  if (!isDbEnabled()) return null;
  const me = await myParticipation(conversationId);
  if (!me) return null;
  const rows = await db
    .select({ createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(1);
  return rows[0]?.createdAt.toISOString() ?? null;
}
