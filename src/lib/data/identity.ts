import "server-only";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import {
  getOrSyncUser,
  emiratesIdInUse,
  normalizeEmiratesId,
} from "./users";

export interface MyIdentity {
  emiratesIdNumber: string;
  emiratesIdFrontUrl: string;
  emiratesIdBackUrl: string;
}

/** The signed-in user's own Emirates ID details, for prefilling the editor. */
export async function getMyIdentity(): Promise<MyIdentity> {
  const empty = { emiratesIdNumber: "", emiratesIdFrontUrl: "", emiratesIdBackUrl: "" };
  const user = await getOrSyncUser();
  if (!user || !isDbEnabled()) return empty;
  const rows = await db
    .select({
      emiratesIdNumber: users.emiratesIdNumber,
      emiratesIdFrontUrl: users.emiratesIdFrontUrl,
      emiratesIdBackUrl: users.emiratesIdBackUrl,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const r = rows[0];
  if (!r) return empty;
  return {
    emiratesIdNumber: r.emiratesIdNumber ?? "",
    emiratesIdFrontUrl: r.emiratesIdFrontUrl ?? "",
    emiratesIdBackUrl: r.emiratesIdBackUrl ?? "",
  };
}

export const verifyIdentitySchema = z.object({
  emiratesIdNumber: z.string().min(4, "Emirates ID number is required"),
  emiratesIdFrontUrl: z.string().min(1, "Emirates ID (front) is required"),
  emiratesIdBackUrl: z.string().min(1, "Emirates ID (back) is required"),
});
export type VerifyIdentityInput = z.infer<typeof verifyIdentitySchema>;

export interface VerifyIdentityResult {
  ok: boolean;
  error?: string;
}

/**
 * Record an Individual account's Emirates ID (identity verification). Emirates
 * ID is REQUIRED for every account and must be globally unique — one ID maps to
 * exactly one account. Dealers use the richer becomeDealer() flow (which also
 * takes a trade license); this is the lightweight path for individuals, who can
 * then both buy and sell.
 */
export async function submitIdentity(
  raw: unknown,
): Promise<VerifyIdentityResult> {
  const input = verifyIdentitySchema.parse(raw);

  const user = await getOrSyncUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (!isDbEnabled()) {
    return { ok: false, error: "Identity verification needs the database configured." };
  }

  const normalized = normalizeEmiratesId(input.emiratesIdNumber);
  if (normalized.length < 4) {
    return { ok: false, error: "Please enter a valid Emirates ID number." };
  }

  // One Emirates ID = one account (checked here for a friendly message; the DB
  // unique index is the hard guarantee against a race).
  if (await emiratesIdInUse(normalized, user.id)) {
    return {
      ok: false,
      error: "This Emirates ID is already registered to another account.",
    };
  }

  try {
    await db
      .update(users)
      .set({
        emiratesIdNumber: normalized,
        emiratesIdFrontUrl: input.emiratesIdFrontUrl,
        emiratesIdBackUrl: input.emiratesIdBackUrl,
        idSubmittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  } catch {
    // Unique-index violation (concurrent submit of the same ID).
    return {
      ok: false,
      error: "This Emirates ID is already registered to another account.",
    };
  }

  return { ok: true };
}
