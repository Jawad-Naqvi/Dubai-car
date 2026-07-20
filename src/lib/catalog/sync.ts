import { db } from "@/lib/db";
import { isDbEnabled } from "@/lib/db/enabled";
import {
  catalogMakes,
  catalogModels,
  catalogTrims,
  catalogSyncRuns,
} from "@/lib/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { popularMakes } from "@/lib/brand";
import {
  vpicModelsForMakeYear,
  wikimediaImage,
  autodevPhoto,
  autodevSpecs,
  autodevKey,
  apiNinjasSpecs,
  carapiTrims,
  slugify,
  isJunkModelName,
} from "./providers";

/**
 * Catalog sync orchestrator.
 *
 * Every run:
 *  1. For each tracked make × recent model years (next year → 2 back),
 *     pull the live model list from vPIC and upsert makes/models/trim-years.
 *     New models launched anywhere in the market show up automatically.
 *  2. Resolve missing model imagery (IMAGIN key → Wikimedia Commons).
 *  3. Enrich missing specs (API-Ninjas / CarAPI when keys are configured).
 *
 * Image + spec enrichment are budgeted per run to stay polite with the free
 * providers; the daily cron converges the catalog over a few runs.
 */

const IMAGE_BUDGET_PER_RUN = 60;
const SPEC_BUDGET_PER_RUN = 60;

export interface SyncStats {
  makes: number;
  modelsSeen: number;
  modelsCreated: number;
  trimYearsCreated: number;
  imagesResolved: number;
  specsResolved: number;
  errors: string[];
}

function targetYears(): number[] {
  const now = new Date().getFullYear();
  return [now + 1, now, now - 1];
}

export async function runCatalogSync(
  trigger: "cron" | "manual" = "cron",
): Promise<{ ok: boolean; stats?: SyncStats; error?: string }> {
  if (!isDbEnabled()) {
    return {
      ok: false,
      error:
        "DATABASE_URL is not configured — the catalog sync needs Postgres. Demo mode serves the bundled catalog snapshot instead.",
    };
  }

  const [run] = await db
    .insert(catalogSyncRuns)
    .values({ trigger, status: "running" })
    .returning();

  const stats: SyncStats = {
    makes: 0,
    modelsSeen: 0,
    modelsCreated: 0,
    trimYearsCreated: 0,
    imagesResolved: 0,
    specsResolved: 0,
    errors: [],
  };

  try {
    /* 1 — makes + models from vPIC */
    for (const makeName of popularMakes) {
      const makeSlug = slugify(makeName);
      const [make] = await db
        .insert(catalogMakes)
        .values({ name: makeName, slug: makeSlug, isPopular: true })
        .onConflictDoUpdate({
          target: catalogMakes.slug,
          set: { updatedAt: new Date() },
        })
        .returning();
      stats.makes++;

      for (const year of targetYears()) {
        const models = await vpicModelsForMakeYear(makeName, year);
        for (const m of models) {
          const modelName = m.Model_Name.trim();
          if (!modelName || isJunkModelName(modelName)) continue;
          stats.modelsSeen++;
          const modelSlug = slugify(modelName);

          const existing = await db.query.catalogModels.findFirst({
            where: and(
              eq(catalogModels.makeId, make.id),
              eq(catalogModels.slug, modelSlug),
            ),
          });

          let modelId: string;
          if (!existing) {
            const [created] = await db
              .insert(catalogModels)
              .values({
                makeId: make.id,
                name: modelName,
                slug: modelSlug,
                latestYear: year,
                firstSeenYear: year,
                vpicModelId: m.Model_ID,
              })
              .onConflictDoNothing()
              .returning();
            if (!created) continue;
            modelId = created.id;
            stats.modelsCreated++;
          } else {
            modelId = existing.id;
            if (!existing.latestYear || year > existing.latestYear) {
              await db
                .update(catalogModels)
                .set({ latestYear: year, updatedAt: new Date() })
                .where(eq(catalogModels.id, modelId));
            }
          }

          const inserted = await db
            .insert(catalogTrims)
            .values({ modelId, year, trimName: "Base" })
            .onConflictDoNothing()
            .returning();
          if (inserted.length) stats.trimYearsCreated += inserted.length;
        }
      }
    }

    /* 2 — imagery for models that have none yet */
    const needImages = await db
      .select({
        id: catalogModels.id,
        name: catalogModels.name,
        latestYear: catalogModels.latestYear,
        makeName: catalogMakes.name,
      })
      .from(catalogModels)
      .innerJoin(catalogMakes, eq(catalogModels.makeId, catalogMakes.id))
      .where(isNull(catalogModels.imageUrl))
      .limit(IMAGE_BUDGET_PER_RUN);

    for (const m of needImages) {
      const year = m.latestYear ?? undefined;
      // Prefer auto.dev's real retail photos when a key is set, else Wikimedia.
      let url: string | null = null;
      let source = "wikimedia";
      if (autodevKey()) {
        url = await autodevPhoto(m.makeName, m.name, year);
        if (url) source = "autodev";
      }
      if (!url) url = await wikimediaImage(m.makeName, m.name, year);
      if (url) {
        await db
          .update(catalogModels)
          .set({ imageUrl: url, imageSource: source, updatedAt: new Date() })
          .where(eq(catalogModels.id, m.id));
        stats.imagesResolved++;
      }
    }

    /* 3 — spec enrichment for trim-years missing specs */
    if (autodevKey() || process.env.API_NINJAS_KEY || process.env.CARAPI_TOKEN) {
      const needSpecs = await db
        .select({
          id: catalogTrims.id,
          year: catalogTrims.year,
          modelName: catalogModels.name,
          makeName: catalogMakes.name,
          modelId: catalogModels.id,
        })
        .from(catalogTrims)
        .innerJoin(catalogModels, eq(catalogTrims.modelId, catalogModels.id))
        .innerJoin(catalogMakes, eq(catalogModels.makeId, catalogMakes.id))
        .where(isNull(catalogTrims.specs))
        .limit(SPEC_BUDGET_PER_RUN);

      for (const trim of needSpecs) {
        /* auto.dev specs first when configured */
        if (autodevKey()) {
          const adSpecs = await autodevSpecs(trim.makeName, trim.modelName, trim.year);
          if (adSpecs && Object.keys(adSpecs).length) {
            await db
              .update(catalogTrims)
              .set({ specs: adSpecs, specSource: "autodev", updatedAt: new Date() })
              .where(eq(catalogTrims.id, trim.id));
            stats.specsResolved++;
            continue;
          }
        }
        const specs = await apiNinjasSpecs(trim.makeName, trim.modelName, trim.year);
        if (specs) {
          await db
            .update(catalogTrims)
            .set({ specs, specSource: "api-ninjas", updatedAt: new Date() })
            .where(eq(catalogTrims.id, trim.id));
          stats.specsResolved++;
          if (specs.class) {
            await db
              .update(catalogModels)
              .set({ bodyType: String(specs.class), updatedAt: new Date() })
              .where(and(eq(catalogModels.id, trim.modelId), isNull(catalogModels.bodyType)));
          }
          continue;
        }
        /* fall back to CarAPI trim expansion */
        const trims = await carapiTrims(trim.makeName, trim.modelName, trim.year);
        if (trims.length) {
          await db
            .update(catalogTrims)
            .set({
              specs: { trims: trims.slice(0, 12) },
              specSource: "carapi",
              updatedAt: new Date(),
            })
            .where(eq(catalogTrims.id, trim.id));
          stats.specsResolved++;
        }
      }
    }

    await db
      .update(catalogSyncRuns)
      .set({ status: "success", stats, finishedAt: new Date() })
      .where(eq(catalogSyncRuns.id, run.id));

    return { ok: true, stats };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(catalogSyncRuns)
      .set({ status: "error", error: message, stats, finishedAt: new Date() })
      .where(eq(catalogSyncRuns.id, run.id));
    return { ok: false, stats, error: message };
  }
}

/** Latest sync runs for the admin panel. */
export async function recentSyncRuns(limit = 10) {
  if (!isDbEnabled()) return [];
  return db
    .select()
    .from(catalogSyncRuns)
    .orderBy(sql`${catalogSyncRuns.startedAt} desc`)
    .limit(limit);
}
