import { NextResponse } from "next/server";
import { verifyB2BBuyer } from "@/lib/data/b2b";
import { isAdminAllowed } from "@/lib/data/users";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAllowed())) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  await verifyB2BBuyer(id, Boolean(body?.verified));
  return NextResponse.json({ ok: true });
}
