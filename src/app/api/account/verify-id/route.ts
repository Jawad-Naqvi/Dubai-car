import { NextResponse } from "next/server";
import { submitIdentity } from "@/lib/data/identity";

/** POST /api/account/verify-id — record the signed-in user's Emirates ID. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return new NextResponse("Invalid JSON", { status: 400 });
  try {
    const result = await submitIdentity(body);
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Verification failed" },
      { status: 422 },
    );
  }
}
