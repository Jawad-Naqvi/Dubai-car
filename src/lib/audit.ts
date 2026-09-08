import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, users } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { log } from "@/lib/log";

/**
 * THE AUDIT TRAIL.
 *
 * The `audit_log` table existed but had ZERO writers — every admin decision,
 * role change, invitation and verification verdict left no record. For a
 * platform that holds identity documents, moves money between three parties
 * and grants privileged accounts by invitation, that is not a gap; it is the
 * absence of accountability. A compliance reviewer's first question is "who
 * approved this and when", and there was no answer.
 *
 * Rules:
 *  - Append-only. Nothing here updates or deletes.
 *  - Never throws. A failure to audit is logged loudly but must not roll back
 *    the action that was being audited (that would let a broken audit sink
 *    take the platform down).
 *  - `metadata` goes through the structured logger's redaction on the way to
 *    logs, but is stored as-is — so callers pass identifiers and verdicts,
 *    never document numbers or message bodies.
 */

export type AuditAction =
  | "org.status_changed"
  | "invitation.created"
  | "invitation.revoked"
  | "invitation.accepted"
  | "user.role_changed"
  | "listing.moderated"
  | "dealer.approved"
  | "dealer.rejected"
  | "shipment.milestone_recorded"
  | "freight.awarded"
  | "account.type_chosen"
  | "account.export_requested"
  | "account.deleted"
  | "cron.freight_expiry"
  | "cron.price_drops";

export interface AuditInput {
  action: AuditAction;
  actorId?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function recordAudit(input: AuditInput): Promise<void> {
  log.info(`audit.${input.action}`, {
    actorId: input.actorId ?? null,
    entityType: input.entityType,
    entityId: input.entityId,
    ...input.metadata,
  });

  if (!isDbEnabled()) return;
  try {
    await db.insert(auditLog).values({
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? null,
    });
  } catch (err) {
    // Loud, but non-fatal: the action already happened.
    log.error("audit.write_failed", { action: input.action, err });
  }
}

export interface AuditEntry {
  id: string;
  action: string;
  actorName: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

/** Newest first, for the admin console. */
export async function getAuditEntries(limit = 200): Promise<AuditEntry[]> {
  if (!isDbEnabled()) return [];
  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      metadata: auditLog.metadata,
      createdAt: auditLog.createdAt,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorId))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    actorName: r.actorName || r.actorEmail || "System",
    entityType: r.entityType,
    entityId: r.entityId,
    metadata: (r.metadata as Record<string, unknown> | null) ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}
