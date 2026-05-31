import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
import { searchListings } from "@/lib/data/listings";
import { getDealers } from "@/lib/data/dealers";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = brand.url;
  const staticRoutes = [
    "",
    "/buy",
    "/sell",
    "/export",
    "/export/register",
    "/valuation",
    "/finance",
    "/dealers",
    "/pricing",
    "/about",
    "/contact",
  ];

  const staticEntries = staticRoutes.flatMap((route) =>
    ["en", "ar"].map((locale) => ({
      url: `${base}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
  );

  const [listings, dealers] = await Promise.all([
    searchListings({ perPage: 1000 }).then((r) => r.items),
    getDealers(),
  ]);

  const listingEntries = listings.flatMap((l) =>
    ["en", "ar"].map((locale) => ({
      url: `${base}/${locale}/listings/${l.id}/${l.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  );

  const dealerEntries = dealers.flatMap((d) =>
    ["en", "ar"].map((locale) => ({
      url: `${base}/${locale}/dealers/${d.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  );

  return [...staticEntries, ...listingEntries, ...dealerEntries];
}
