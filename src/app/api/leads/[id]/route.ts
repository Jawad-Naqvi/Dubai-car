import { NextResponse } from "next/server";
import { updateLeadStatus } from "@/lib/data/leads";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body?.status) {
    return NextResponse.json({ error: "status required" }, { status: 400 });
  }
  await updateLeadStatus(id, body.status);
  return NextResponse.json({ ok: true });
}
