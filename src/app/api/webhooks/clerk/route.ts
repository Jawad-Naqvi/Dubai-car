import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
      if (id) await db.delete(users).where(eq(users.clerkId, id));
    }
  } catch (err) {
    console.error("[clerk-webhook]", err);
    return new Response("Internal error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
