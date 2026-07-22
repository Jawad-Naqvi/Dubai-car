import { NextResponse } from "next/server";
import { requestExportDoc } from "@/lib/data/b2b";
import { getOrSyncUser } from "@/lib/data/users";

/** POST /api/b2b/doc-request — real doc request, notifies the export desk. */
export async function POST(req: Request) {
  const user = await getOrSyncUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const docKey = typeof body?.docKey === "string" ? body.docKey : "";
  if (!docKey) return NextResponse.json({ error: "docKey required" }, { status: 400 });

  try {
    await requestExportDoc(user.id, docKey);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 422 },
    );
  }
}
