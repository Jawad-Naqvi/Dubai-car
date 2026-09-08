import { NextResponse } from "next/server";
import { uploadFiles, isStorageEnabled } from "@/lib/media";
import { getOrSyncUser } from "@/lib/data/users";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_FILES = 4;
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB per file (scanned IDs/licenses)
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

/**
 * KYC document upload (Emirates ID, trade license). Same storage chain as
 * /api/upload but allows PDFs and requires sign-in — retrieval is gated
 * separately via /api/kyc-doc/[dealerId] (not publicly servable).
 */
export async function POST(req: Request) {
  const user = await getOrSyncUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to upload" }, { status: 401 });
  }

  const rl = rateLimit(`upload-doc:${user.id}:${clientIp(req)}`, 20, 60_000);
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
        { error: `Unsupported file type: ${f.type || "unknown"}. Use JPG, PNG, or PDF.` },
        { status: 415 },
      );
    }
    if (f.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `"${f.name}" is too large (max 15 MB)` },
        { status: 413 },
      );
    }
  }

  // Stamp the uploader onto the asset so /api/media/[id] can decide who may
  // read it back. Without an owner a private document is readable by nobody
  // but an admin, which is the safe direction to fail.
  const urls = await uploadFiles(files, {
    visibility: "private",
    ownerUserId: user.id,
  });
  return NextResponse.json({ urls, stored: isStorageEnabled() });
}
