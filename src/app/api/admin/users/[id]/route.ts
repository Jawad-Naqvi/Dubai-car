import { NextResponse } from "next/server";
import { setUserRole } from "@/lib/data/admin";
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
  if (!body?.role) {
    return NextResponse.json({ error: "role required" }, { status: 400 });
  }
  await setUserRole(id, body.role);
  return NextResponse.json({ ok: true });
}
