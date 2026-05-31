import { NextResponse } from "next/server";
import { uploadImages, isStorageEnabled } from "@/lib/media";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return new NextResponse("Expected multipart form", { status: 400 });

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  const urls = await uploadImages(files);
  return NextResponse.json({ urls, stored: isStorageEnabled() });
}
