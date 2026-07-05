import "server-only";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dealers } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { getEffectiveDealer } from "./users";
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
});

export async function updateDealerProfile(raw: unknown): Promise<boolean> {
  const patch = dealerProfileSchema.parse(raw);
  if (!isDbEnabled()) return true; // demo: accept no-op
  const d = await getEffectiveDealer();
  if (!d) return false;
  await db
    .update(dealers)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(dealers.id, d.id));
  bust("dealers");
  return true;
}
