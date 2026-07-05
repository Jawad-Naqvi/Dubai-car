import "server-only";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { bust } from "./revalidate";

export interface BannerView {
  id: string;
  placement: string;
  title: string;
  imageUrl: string;
  link: string;
  isActive: boolean;
  createdAt?: string;
}

export async function getBanners(): Promise<BannerView[]> {
  if (!isDbEnabled()) return [];
  const rows = await db
    .select()
    .from(banners)
    .orderBy(desc(banners.startsAt))
    .limit(100);
  return rows.map((b) => ({
    id: b.id,
    placement: b.placement,
    title: b.title ?? "",
    imageUrl: b.imageUrl,
    link: b.link ?? "",
    isActive: b.isActive,
    createdAt: b.startsAt?.toISOString(),
  }));
}

export const bannerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  placement: z.string().min(1),
  imageUrl: z.string().min(1, "Image URL is required"),
  link: z.string().optional(),
});

export async function createBanner(raw: unknown): Promise<{ id: string }> {
  const input = bannerSchema.parse(raw);
  if (!isDbEnabled()) return { id: "demo" };
  const [row] = await db
    .insert(banners)
    .values({
      title: input.title,
      placement: input.placement,
      imageUrl: input.imageUrl,
      link: input.link,
      isActive: true,
    })
    .returning({ id: banners.id });
  bust("banners");
  return { id: row.id };
}

export async function toggleBanner(id: string, active: boolean): Promise<boolean> {
  if (!isDbEnabled()) return true;
  await db.update(banners).set({ isActive: active }).where(eq(banners.id, id));
  bust("banners");
  return true;
}

export async function deleteBanner(id: string): Promise<boolean> {
  if (!isDbEnabled()) return true;
  await db.delete(banners).where(eq(banners.id, id));
  bust("banners");
  return true;
}
