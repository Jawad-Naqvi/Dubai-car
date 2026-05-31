import "server-only";

/**
 * Media upload adapter. When Cloudflare R2 credentials are present we upload to
 * R2 and return CDN URLs. Until then (demo mode), we map each uploaded file to a
 * curated stock photo so the listing always renders a real car image and the
 * upload UX is fully exercised. Swap `isStorageEnabled` inputs for production.
 */
export function isStorageEnabled(): boolean {
  return Boolean(
    process.env.CF_R2_ACCOUNT_ID &&
      process.env.CF_R2_ACCESS_KEY_ID &&
      process.env.CF_R2_SECRET_ACCESS_KEY &&
      process.env.CF_R2_BUCKET,
  );
}

const STOCK = [
  "1583121274602-3e2820c69888",
  "1606664515524-ed2f786a0bd6",
  "1555215695-3004980ad54e",
  "1494976388531-d1058494cdd8",
  "1568844293986-8d0400bd4745",
  "1606220588913-b3aacb4d2f46",
  "1503376780353-7e6692767b70",
  "1565891741441-64926e441838",
  "1567808291548-fc3ee04dbcf0",
  "1568605114967-8130f3a36994",
].map(
  (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`,
);

let rot = 0;

export async function uploadImages(files: File[]): Promise<string[]> {
  if (!isStorageEnabled()) {
    // Demo: return deterministic-ish stock photos, one per uploaded file.
    return files.map(() => {
      const url = STOCK[rot % STOCK.length];
      rot += 1;
      return url;
    });
  }

  // ---- Real R2 upload (S3-compatible) ----
  // Lazy import via a variable specifier so the demo build doesn't require the
  // AWS SDK to be installed. Run `npm i @aws-sdk/client-s3` before enabling R2.
  const sdkName = "@aws-sdk/client-s3";
  const { S3Client, PutObjectCommand } = await import(sdkName);
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
