import { NextResponse } from "next/server";
import { updateListingStatus, deleteListing } from "@/lib/data/dashboard";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return new NextResponse("Invalid JSON", { status: 400 });
  await updateListingStatus(id, {
    status: body.status,
    isFeatured: body.isFeatured,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await deleteListing(id);
  return NextResponse.json({ ok: true });
}
