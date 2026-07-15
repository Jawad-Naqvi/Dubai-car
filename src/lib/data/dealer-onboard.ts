import "server-only";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { dealers, users } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { getOrSyncUser, getCurrentDealer } from "./users";
import { bust } from "./revalidate";

export const becomeDealerSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  emirate: z.string().min(2, "Emirate is required"),
  phone: z.string().min(6, "A contact number is required"),
  whatsapp: z.string().optional(),
  tradeLicense: z.string().optional(),
  tagline: z.string().optional(),
});
export type BecomeDealerInput = z.infer<typeof becomeDealerSchema>;

function slugify(v: string): string {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export interface BecomeDealerResult {
  ok: boolean;
  dealerSlug?: string;
  error?: string;
}

/**
 * Promote the signed-in user to a dealer (yard owner / vendor): create their
 * dealer record, flip their role to "dealer" in both the DB and Clerk
 * publicMetadata (RBAC source of truth), so their next dashboard load opens the
 * seller area. Idempotent — returns the existing dealer if already onboarded.
 */
export async function becomeDealer(raw: unknown): Promise<BecomeDealerResult> {
  const input = becomeDealerSchema.parse(raw);

  const user = await getOrSyncUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!isDbEnabled()) {
    return {
      ok: false,
      error: "Seller onboarding needs the database configured.",
    };
  }

  const existing = await getCurrentDealer();
  if (existing) return { ok: true, dealerSlug: existing.slug };

  // Unique slug (append a short suffix on collision).
  let slug = slugify(input.businessName) || "dealer";
  const clash = await db
    .select({ id: dealers.id })
    .from(dealers)
    .where(eq(dealers.slug, slug))
    .limit(1);
  if (clash[0]) slug = `${slug}-${user.id.slice(0, 4)}`;

  const [dealer] = await db
    .insert(dealers)
    .values({
      userId: user.id,
      slug,
      businessName: input.businessName,
      emirate: input.emirate,
      phone: input.phone,
      whatsapp: input.whatsapp || input.phone,
      tradeLicense: input.tradeLicense,
      tagline: input.tagline,
      subscriptionTier: "free",
    })
    .returning({ slug: dealers.slug });

  // Promote the role in the DB and in Clerk (RBAC source of truth).
  await db.update(users).set({ role: "dealer" }).where(eq(users.id, user.id));
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(user.clerkId, {
      publicMetadata: { role: "dealer" },
    });
  } catch {
    // DB role still updated; Clerk metadata will reconcile on next webhook.
  }

  bust("listings");
  return { ok: true, dealerSlug: dealer?.slug ?? slug };
}
