import { NextResponse } from "next/server";
import { moderateListing } from "@/lib/data/admin";
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
  if (body?.action !== "approve" && body?.action !== "reject") {
    return NextResponse.json({ error: "action must be approve|reject" }, { status: 400 });
  }
  await moderateListing(id, body.action);
  return NextResponse.json({ ok: true });
}
