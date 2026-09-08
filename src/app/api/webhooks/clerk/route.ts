import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, identityDocuments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import { log } from "@/lib/log";

export async function POST(req: Request) {
  const SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!SECRET) {
    return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });
  }

  const h = await headers();
  const svixId = h.get("svix-id");
  const svixTimestamp = h.get("svix-timestamp");
  const svixSignature = h.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const type = evt.type;

  try {
    if (type === "user.created" || type === "user.updated") {
      const u = evt.data;
      const email = u.email_addresses?.[0]?.email_address ?? "";
      const phone = u.phone_numbers?.[0]?.phone_number ?? null;
      const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || null;
      const role =
        ((u.public_metadata as { role?: string } | undefined)?.role as
          | "buyer"
          | "dealer"
          | "b2b_importer"
          | "admin") ?? "buyer";

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, u.id))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(users).values({
          clerkId: u.id,
          email,
          phone,
          name,
          imageUrl: u.image_url,
          role,
        });
      } else {
        await db
          .update(users)
          .set({
            email,
            phone,
            name,
            imageUrl: u.image_url,
            role,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, u.id));
      }
    } else if (type === "user.deleted") {
      const id = evt.data.id;
      if (id) {
        // Tombstone rather than DELETE. A hard delete cascaded through foreign
        // keys and took other people's orders, messages and shipment history
        // with it — a buyer closing their account must not erase a seller's
        // records. Personal identifiers and ID documents are cleared here; the
        // in-app flow (lib/data/account-data.ts) does the fuller erasure.
        const [row] = await db
          .update(users)
          .set({
            email: `deleted+${id.slice(-8)}@removed.invalid`,
            name: "Deleted user",
            phone: null,
            imageUrl: null,
            emiratesIdNumber: null,
            emiratesIdFrontUrl: null,
            emiratesIdBackUrl: null,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, id))
          .returning({ id: users.id });
        if (row) {
          await db
            .delete(identityDocuments)
            .where(eq(identityDocuments.userId, row.id));
          await recordAudit({
            action: "account.deleted",
            actorId: row.id,
            entityType: "user",
            entityId: row.id,
            metadata: { via: "clerk_webhook" },
          });
        }
      }
    }
  } catch (err) {
    log.error("clerk_webhook.failed", { err });
    return new Response("Internal error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
