import { NextResponse } from "next/server";
import { markConversationRead } from "@/lib/data/chat";

/** Marks the thread read up to now for the signed-in participant. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ok = await markConversationRead(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
