import "server-only";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";

/**
 * Media upload adapter. Storage backend, in priority order:
 *  1. Cloudflare R2 (CDN URLs) when the CF_R2_* env vars are set.
 *  2. Postgres — the real bytes are stored in the `media_assets` table and
 *     served by GET /api/media/[id]. Survives serverless deploys, no external
 *     bucket needed. This is the default once the DB is connected.
 *  3. Local `public/uploads/` — only when there's no DB (pure demo mode).
 *
 * `isStorageEnabled()` reports whether uploads are durably stored (R2 or DB),
 * i.e. anything other than the ephemeral local-disk fallback.
 */
export function isR2Enabled(): boolean {
  return Boolean(
    process.env.CF_R2_ACCOUNT_ID &&
      process.env.CF_R2_ACCESS_KEY_ID &&
      process.env.CF_R2_SECRET_ACCESS_KEY &&
      process.env.CF_R2_BUCKET,
  );
}

export function isStorageEnabled(): boolean {
  return isR2Enabled() || isDbEnabled();
}

function safeExt(name: string, type: string) {
  const fromName = (name.split(".").pop() || "").toLowerCase();
  if (/^(jpe?g|png|webp|avif|gif)$/.test(fromName)) return fromName;
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("avif")) return "avif";
  return "jpg";
}

let counter = 0;

export async function uploadImages(files: File[]): Promise<string[]> {
  // ---- Postgres storage (default once DB is connected) ----
  if (!isR2Enabled() && isDbEnabled()) {
    const urls: string[] = [];
    for (const file of files) {
      const bytes = Buffer.from(await file.arrayBuffer());
      const [row] = await db
        .insert(mediaAssets)
        .values({
          mimeType: file.type || "image/jpeg",
          size: bytes.length,
          data: bytes,
        })
        .returning({ id: mediaAssets.id });
      urls.push(`/api/media/${row.id}`);
    }
    return urls;
  }

  // ---- Local disk fallback (pure demo / no DB, no R2) ----
  if (!isR2Enabled()) {
    // Save the real uploaded files to /public/uploads and return their paths.
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const urls: string[] = [];
    for (const file of files) {
      counter += 1;
      const ext = safeExt(file.name, file.type);
      const filename = `listing-${Date.now()}-${counter}.${ext}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(dir, filename), bytes);
      urls.push(`/uploads/${filename}`);
    }
    return urls;
  }

  // ---- Real R2 upload (S3-compatible) ----
  // Lazy import via a variable specifier so the demo build doesn't require the
  // AWS SDK to be installed. Run `npm i @aws-sdk/client-s3` before enabling R2.
  const sdkName = "@aws-sdk/client-s3";
  const { S3Client, PutObjectCommand } = await import(
    /* webpackIgnore: true */ /* turbopackIgnore: true */ sdkName
  );
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CF_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CF_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CF_R2_SECRET_ACCESS_KEY!,
    },
  });
  const bucket = process.env.CF_R2_BUCKET!;
  const base =
    process.env.CF_R2_PUBLIC_URL ??
    `https://${bucket}.${process.env.CF_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop() || "jpg";
    const key = `listings/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: bytes,
        ContentType: file.type || "image/jpeg",
      }),
    );
    urls.push(`${base}/${key}`);
  }
  return urls;
}
