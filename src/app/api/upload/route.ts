import { NextResponse } from "next/server";
import { uploadImages, isStorageEnabled } from "@/lib/media";
import { getOrSyncUser } from "@/lib/data/users";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_FILES = 20;
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per file
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

/**
 * Image upload. Locked down (was previously wide open): requires a signed-in
 * user, caps file count/size, and enforces an image MIME allowlist so the
 * endpoint can't be used to flood storage or host arbitrary files.
 */
export async function POST(req: Request) {
  const user = await getOrSyncUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to upload" }, { status: 401 });
  }

  const rl = rateLimit(`upload:${user.id}:${clientIp(req)}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many uploads, slow down." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) return new NextResponse("Expected multipart form", { status: 400 });

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Too many files (max ${MAX_FILES})` },
      { status: 400 },
    );
  }
  for (const f of files) {
    if (!ALLOWED.has(f.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${f.type || "unknown"}` },
        { status: 415 },
      );
    }
    if (f.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `"${f.name}" is too large (max 8 MB)` },
        { status: 413 },
      );
    }
  }

  const urls = await uploadImages(files);
  return NextResponse.json({ urls, stored: isStorageEnabled() });
}
