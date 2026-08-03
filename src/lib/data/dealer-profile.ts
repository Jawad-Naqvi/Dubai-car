import "server-only";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dealers, users } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import {
  getEffectiveDealer,
  emiratesIdInUse,
  normalizeEmiratesId,
} from "./users";
import { bust } from "./revalidate";

export interface DealerProfile {
  id: string;
  businessName: string;
  slug: string;
  tagline: string;
  description: string;
  emirate: string;
  address: string;
  phone: string;
  whatsapp: string;
  website: string;
  logoUrl: string;
  subscriptionTier: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  // Identity & documents (editable from the profile page)
  emiratesIdNumber: string;
  emiratesIdFrontUrl: string;
  emiratesIdBackUrl: string;
  tradeLicense: string;
  tradeLicenseDocUrl: string;
  kycStatus: string;
}

const EMPTY: DealerProfile = {
  id: "demo",
  businessName: "Al Futtaim Motors",
  slug: "al-futtaim-motors",
  tagline: "Authorised Toyota, Lexus dealer in the UAE since 1955.",
  description: "",
  emirate: "Dubai",
  address: "",
  phone: "",
  whatsapp: "",
  website: "",
  logoUrl: "",
  subscriptionTier: "gold",
  isVerified: true,
  rating: 4.8,
  reviewCount: 412,
  emiratesIdNumber: "",
  emiratesIdFrontUrl: "",
  emiratesIdBackUrl: "",
  tradeLicense: "",
  tradeLicenseDocUrl: "",
  kycStatus: "approved",
};

export async function getDealerProfile(): Promise<DealerProfile> {
  if (!isDbEnabled()) return EMPTY;
  const d = await getEffectiveDealer();
  if (!d) return EMPTY;
  return {
    id: d.id,
    businessName: d.businessName,
    slug: d.slug,
    tagline: d.tagline ?? "",
    description: d.description ?? "",
    emirate: d.emirate,
    address: d.address ?? "",
    phone: d.phone ?? "",
    whatsapp: d.whatsapp ?? "",
    website: d.website ?? "",
    logoUrl: d.logoUrl ?? "",
    subscriptionTier: d.subscriptionTier,
    isVerified: d.isVerified,
    rating: d.rating ?? 0,
    reviewCount: d.reviewCount ?? 0,
    emiratesIdNumber: d.emiratesIdNumber ?? "",
    emiratesIdFrontUrl: d.emiratesIdFrontUrl ?? "",
    emiratesIdBackUrl: d.emiratesIdBackUrl ?? "",
    tradeLicense: d.tradeLicense ?? "",
    tradeLicenseDocUrl: d.tradeLicenseDocUrl ?? "",
    kycStatus: d.kycStatus,
  };
}

export const dealerProfileSchema = z.object({
  businessName: z.string().min(2).optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  emirate: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  website: z.string().optional(),
  logoUrl: z.string().optional(),
  // Identity & documents (editable self-service)
  emiratesIdNumber: z.string().optional(),
  emiratesIdFrontUrl: z.string().optional(),
  emiratesIdBackUrl: z.string().optional(),
  tradeLicense: z.string().optional(),
  tradeLicenseDocUrl: z.string().optional(),
});

export interface UpdateProfileResult {
  ok: boolean;
  error?: string;
}

export async function updateDealerProfile(raw: unknown): Promise<UpdateProfileResult> {
  const patch = dealerProfileSchema.parse(raw);
  if (!isDbEnabled()) return { ok: true }; // demo: accept no-op
  const d = await getEffectiveDealer();
  if (!d) return { ok: false, error: "No seller profile found." };

  const {
    emiratesIdNumber,
    emiratesIdFrontUrl,
    emiratesIdBackUrl,
    ...rest
  } = patch;

  // Business + trade-license fields update directly.
  const dealerSet: Partial<typeof dealers.$inferInsert> = {
    ...rest,
    updatedAt: new Date(),
  };

  // Emirates ID number change must stay globally unique (one ID = one account).
  let normalizedEid: string | undefined;
  if (emiratesIdNumber !== undefined && emiratesIdNumber.trim() !== "") {
    normalizedEid = normalizeEmiratesId(emiratesIdNumber);
    if (await emiratesIdInUse(normalizedEid, d.userId)) {
      return {
        ok: false,
        error: "This Emirates ID is already registered to another account.",
      };
    }
    dealerSet.emiratesIdNumber = normalizedEid;
  }
  if (emiratesIdFrontUrl) dealerSet.emiratesIdFrontUrl = emiratesIdFrontUrl;
  if (emiratesIdBackUrl) dealerSet.emiratesIdBackUrl = emiratesIdBackUrl;

  try {
    await db.update(dealers).set(dealerSet).where(eq(dealers.id, d.id));
  } catch {
    return {
      ok: false,
      error: "This Emirates ID is already registered to another account.",
    };
  }

  // Mirror the Emirates ID onto the users row so the global uniqueness index
  // and the "identity on file" gate stay in sync with the dealer record.
  if (normalizedEid || emiratesIdFrontUrl || emiratesIdBackUrl) {
    await db
      .update(users)
      .set({
        ...(normalizedEid ? { emiratesIdNumber: normalizedEid } : {}),
        ...(emiratesIdFrontUrl ? { emiratesIdFrontUrl } : {}),
        ...(emiratesIdBackUrl ? { emiratesIdBackUrl } : {}),
        idSubmittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, d.userId));
  }

  bust("dealers");
  return { ok: true };
}
