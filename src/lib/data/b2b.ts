import "server-only";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { b2bBuyers, users } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { demoStore, demoId, type DemoB2BBuyer } from "./demo-store";
import type { CurrentUser } from "./users";

export const b2bRegisterSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  country: z.string().min(2, "Country is required"),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  tradeLicenseUrl: z.string().optional(),
});

export type B2BRegisterInput = z.infer<typeof b2bRegisterSchema>;

export async function registerB2BBuyer(
  raw: unknown,
  user?: CurrentUser,
): Promise<{ id: string }> {
  const input = b2bRegisterSchema.parse(raw);

  if (!isDbEnabled()) {
    const buyer: DemoB2BBuyer = {
      id: demoId("B2B"),
      companyName: input.companyName,
      country: input.country,
      contactPhone: input.contactPhone,
      email: input.email || undefined,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };
    demoStore().b2bBuyers.unshift(buyer);
    return { id: buyer.id };
  }

  // Attach to the signed-in user, or create a lightweight importer account from
  // the submitted contact details (so guest registrations still persist).
  let userId = user?.id;
  if (!userId) {
    const email =
      input.email || `b2b+${Date.now()}@guest.${"dxbmotors.ae"}`;
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing[0]) {
      userId = existing[0].id;
    } else {
      const [created] = await db
        .insert(users)
        .values({
          clerkId: `guest_b2b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          email,
          name: input.contactName || input.companyName,
          role: "b2b_importer",
        })
        .returning({ id: users.id });
      userId = created.id;
    }
  }

  const [row] = await db
    .insert(b2bBuyers)
    .values({
      userId,
      companyName: input.companyName,
      country: input.country,
      contactPhone: input.contactPhone,
      tradeLicenseUrl: input.tradeLicenseUrl,
      isVerified: false,
    })
    .onConflictDoNothing()
    .returning({ id: b2bBuyers.id });

  await db
    .update(users)
    .set({ role: "b2b_importer" })
    .where(eq(users.id, userId));

  return { id: row?.id ?? "existing" };
}

export interface B2BBuyerView {
  id: string;
  companyName: string;
  country: string;
  contactPhone?: string;
  email?: string;
  isVerified: boolean;
  createdAt: string;
}

export async function getB2BBuyers(): Promise<B2BBuyerView[]> {
  if (!isDbEnabled()) {
    return demoStore().b2bBuyers.map((b) => ({ ...b }));
  }
  const rows = await db
    .select()
    .from(b2bBuyers)
    .orderBy(desc(b2bBuyers.createdAt))
    .limit(200);
  return rows.map((b) => ({
    id: b.id,
    companyName: b.companyName,
    country: b.country,
    contactPhone: b.contactPhone ?? undefined,
    isVerified: b.isVerified,
    createdAt: b.createdAt.toISOString(),
  }));
}

export async function verifyB2BBuyer(
  id: string,
  verified: boolean,
): Promise<boolean> {
  if (!isDbEnabled()) {
    const b = demoStore().b2bBuyers.find((x) => x.id === id);
    if (b) b.isVerified = verified;
    return true;
  }
  await db
    .update(b2bBuyers)
    .set({ isVerified: verified, verifiedAt: verified ? new Date() : null })
    .where(eq(b2bBuyers.id, id));
  return true;
}
