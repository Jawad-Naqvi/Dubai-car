import "server-only";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { dealers, users } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { getOrSyncUser, getCurrentDealer, type CurrentUser } from "./users";
import { bust } from "./revalidate";
import { sendEmail } from "@/lib/notify";

export const becomeDealerSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  emirate: z.string().min(2, "Emirate is required"),
  phone: z.string().min(6, "A contact number is required"),
  whatsapp: z.string().optional(),
  tagline: z.string().optional(),
  emiratesIdNumber: z.string().min(4, "Emirates ID number is required"),
  emiratesIdFrontUrl: z.string().min(1, "Emirates ID (front) is required"),
  emiratesIdBackUrl: z.string().min(1, "Emirates ID (back) is required"),
  tradeLicense: z.string().min(2, "Trade license number is required"),
  tradeLicenseDocUrl: z.string().min(1, "Trade license document is required"),
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
 * Submit (or resubmit) a seller/KYC application for the signed-in user.
 *
 * Creates the dealer record with kycStatus "pending" AND promotes the user to
 * the "dealer" role immediately, so they land on the SELLER dashboard (not the
 * buyer hub) right after onboarding. This grants the seller *workspace* (a
 * view) — it does NOT grant the *power* to publish: listings from an unverified
 * dealer are held for review (see createListing's isVerified gate), and an
 * admin must approve KYC before they go live. Seeing the dashboard and being
 * allowed to sell are deliberately separate steps.
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
  if (existing) {
    if (existing.kycStatus === "approved") {
      return { ok: true, dealerSlug: existing.slug };
    }
    // Resubmission after rejection, or an in-flight pending update.
    await db
      .update(dealers)
      .set({
        businessName: input.businessName,
        emirate: input.emirate,
        phone: input.phone,
        whatsapp: input.whatsapp || input.phone,
        tagline: input.tagline,
        tradeLicense: input.tradeLicense,
        tradeLicenseDocUrl: input.tradeLicenseDocUrl,
        emiratesIdNumber: input.emiratesIdNumber,
        emiratesIdFrontUrl: input.emiratesIdFrontUrl,
        emiratesIdBackUrl: input.emiratesIdBackUrl,
        kycStatus: "pending",
        kycRejectionReason: null,
        kycSubmittedAt: new Date(),
        kycReviewedAt: null,
      })
      .where(eq(dealers.id, existing.id));
    await promoteToDealer(user);
    await notifyApplicationReceived(user.email, input.businessName);
    return { ok: true, dealerSlug: existing.slug };
  }

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
      tradeLicenseDocUrl: input.tradeLicenseDocUrl,
      emiratesIdNumber: input.emiratesIdNumber,
      emiratesIdFrontUrl: input.emiratesIdFrontUrl,
      emiratesIdBackUrl: input.emiratesIdBackUrl,
      tagline: input.tagline,
      subscriptionTier: "free",
      kycStatus: "pending",
      kycSubmittedAt: new Date(),
    })
    .returning({ slug: dealers.slug });

  await promoteToDealer(user);
  bust("listings");
  await notifyApplicationReceived(user.email, input.businessName);
  return { ok: true, dealerSlug: dealer?.slug ?? slug };
}

/** Promote a user to the "dealer" role in both the DB and Clerk (RBAC source
 *  of truth), so their next dashboard load opens the seller workspace. */
async function promoteToDealer(user: CurrentUser) {
  if (user.role === "dealer") return;
  await db.update(users).set({ role: "dealer" }).where(eq(users.id, user.id));
  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(user.clerkId, {
      publicMetadata: { role: "dealer" },
    });
  } catch {
    // DB role still updated; Clerk metadata reconciles on next sync.
  }
}

async function notifyApplicationReceived(email: string, businessName: string) {
  await sendEmail({
    to: email,
    subject: "We've received your DXB Motors seller application",
    body: `Thanks for applying to sell on DXB Motors as "${businessName}". Our team reviews Emirates ID and trade license documents before approving new sellers — you'll get an email as soon as a decision is made, usually within 1-2 business days.`,
    label: "kyc application received",
  });
}
