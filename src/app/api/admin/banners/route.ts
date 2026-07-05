import { NextResponse } from "next/server";
import { createBanner, toggleBanner, deleteBanner } from "@/lib/data/banners";
import { isAdminAllowed } from "@/lib/data/users";

export async function POST(req: Request) {
  if (!(await isAdminAllowed())) return new NextResponse("Forbidden", { status: 403 });
  const body = await req.json().catch(() => null);
  try {
    const r = await createBanner(body);
    return NextResponse.json(r, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 422 },
    );
  }
}

export async function PATCH(req: Request) {
  if (!(await isAdminAllowed())) return new NextResponse("Forbidden", { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await toggleBanner(body.id, Boolean(body.isActive));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await isAdminAllowed())) return new NextResponse("Forbidden", { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteBanner(id);
  return NextResponse.json({ ok: true });
}
