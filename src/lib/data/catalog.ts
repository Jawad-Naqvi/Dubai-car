import { db } from "@/lib/db";
import { isDbEnabled } from "@/lib/db/enabled";
import { catalogMakes, catalogModels, catalogTrims } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { carImageUrl } from "@/lib/car-images";
import seedCatalog from "@/lib/catalog/seed-catalog.json";

/**
 * Read API for the auto-synced vehicle catalog.
 * DB-backed when Postgres is configured; otherwise serves the bundled
 * snapshot (itself generated from the same live APIs — never hand-typed).
 */

export interface CatalogMakeView {
  name: string;
  slug: string;
  modelCount: number;
}

export interface CatalogModelView {
  name: string;
  slug: string;
  makeName: string;
  makeSlug: string;
  latestYear: number | null;
  years: number[];
  bodyType: string | null;
  imageUrl: string;
  specs: Record<string, unknown> | null;
}

interface SeedModel {
  name: string;
  slug: string;
  latestYear: number;
  years: number[];
  imageUrl: string | null;
}
interface SeedMake {
  name: string;
  slug: string;
  models: SeedModel[];
}
const seed = seedCatalog as unknown as { generatedAt: string; makes: SeedMake[] };

function seedModelView(make: SeedMake, m: SeedModel): CatalogModelView {
  return {
    name: m.name,
    slug: m.slug,
    makeName: make.name,
    makeSlug: make.slug,
    latestYear: m.latestYear,
    years: m.years,
    bodyType: null,
    imageUrl: carImageUrl({
      make: make.name,
      model: m.name,
      year: m.latestYear,
      fallbackUrl: m.imageUrl ?? undefined,
    }),
    specs: null,
  };
}

export async function getCatalogMakes(): Promise<CatalogMakeView[]> {
  if (isDbEnabled()) {
    try {
      const rows = await db
        .select({
          name: catalogMakes.name,
          slug: catalogMakes.slug,
          modelId: catalogModels.id,
        })
        .from(catalogMakes)
        .leftJoin(catalogModels, eq(catalogModels.makeId, catalogMakes.id));
      const map = new Map<string, CatalogMakeView>();
      for (const r of rows) {
        const cur = map.get(r.slug) ?? { name: r.name, slug: r.slug, modelCount: 0 };
        if (r.modelId) cur.modelCount++;
        map.set(r.slug, cur);
      }
      if (map.size) return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      /* fall through to seed */
    }
  }
  return seed.makes
    .map((m) => ({ name: m.name, slug: m.slug, modelCount: m.models.length }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCatalogModels(opts?: {
  makeSlug?: string;
  limit?: number;
}): Promise<CatalogModelView[]> {
  const limit = opts?.limit ?? 60;
  if (isDbEnabled()) {
    try {
      const where = opts?.makeSlug ? eq(catalogMakes.slug, opts.makeSlug) : undefined;
      const rows = await db
        .select({
          name: catalogModels.name,
          slug: catalogModels.slug,
          makeName: catalogMakes.name,
          makeSlug: catalogMakes.slug,
          latestYear: catalogModels.latestYear,
          bodyType: catalogModels.bodyType,
          imageUrl: catalogModels.imageUrl,
        })
        .from(catalogModels)
        .innerJoin(catalogMakes, eq(catalogModels.makeId, catalogMakes.id))
        .where(where)
        .orderBy(desc(catalogModels.latestYear), catalogModels.name)
        .limit(limit);
      if (rows.length) {
        return rows.map((r) => ({
          ...r,
          years: r.latestYear ? [r.latestYear] : [],
          specs: null,
          imageUrl: carImageUrl({
            make: r.makeName,
            model: r.name,
            year: r.latestYear ?? undefined,
            fallbackUrl: r.imageUrl ?? undefined,
          }),
        }));
      }
    } catch {
      /* fall through to seed */
    }
  }
  const makes = opts?.makeSlug
    ? seed.makes.filter((m) => m.slug === opts.makeSlug)
    : seed.makes;
  const out: CatalogModelView[] = [];
  for (const make of makes) {
    for (const m of make.models) out.push(seedModelView(make, m));
  }
  out.sort((a, b) => (b.latestYear ?? 0) - (a.latestYear ?? 0) || a.name.localeCompare(b.name));
  return out.slice(0, limit);
}

export async function getCatalogModel(
  makeSlug: string,
  modelSlug: string,
): Promise<CatalogModelView | null> {
  if (isDbEnabled()) {
    try {
      const row = await db
        .select({
          id: catalogModels.id,
          name: catalogModels.name,
          slug: catalogModels.slug,
          makeName: catalogMakes.name,
          makeSlug: catalogMakes.slug,
          latestYear: catalogModels.latestYear,
          bodyType: catalogModels.bodyType,
          imageUrl: catalogModels.imageUrl,
        })
        .from(catalogModels)
        .innerJoin(catalogMakes, eq(catalogModels.makeId, catalogMakes.id))
        .where(and(eq(catalogMakes.slug, makeSlug), eq(catalogModels.slug, modelSlug)))
        .limit(1);
      const m = row[0];
      if (m) {
        const trims = await db
          .select()
          .from(catalogTrims)
          .where(eq(catalogTrims.modelId, m.id))
          .orderBy(desc(catalogTrims.year));
        const specs =
          (trims.find((t) => t.specs)?.specs as Record<string, unknown> | null) ?? null;
        return {
          name: m.name,
          slug: m.slug,
          makeName: m.makeName,
          makeSlug: m.makeSlug,
          latestYear: m.latestYear,
          years: [...new Set(trims.map((t) => t.year))].sort((a, b) => b - a),
          bodyType: m.bodyType,
          specs,
          imageUrl: carImageUrl({
            make: m.makeName,
            model: m.name,
            year: m.latestYear ?? undefined,
            fallbackUrl: m.imageUrl ?? undefined,
          }),
        };
      }
    } catch {
      /* fall through to seed */
    }
  }
  const make = seed.makes.find((m) => m.slug === makeSlug);
  const model = make?.models.find((m) => m.slug === modelSlug);
  if (!make || !model) return null;
  return seedModelView(make, model);
}
