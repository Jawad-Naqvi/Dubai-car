import { NextResponse } from "next/server";
import { toggleDealerVerified } from "@/lib/data/admin";
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
  await toggleDealerVerified(id, Boolean(body?.verified));
  return NextResponse.json({ ok: true });
}
