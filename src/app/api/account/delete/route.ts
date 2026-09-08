import { NextResponse } from "next/server";
import { deleteMyAccount } from "@/lib/data/account-data";

/**
 * Right to erasure (GDPR Art. 17).
 *
 * Requires a typed confirmation in the body, so this can never fire from a
 * stray click or a forged cross-site request.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const confirmation = typeof body?.confirm === "string" ? body.confirm : "";

  const result = await deleteMyAccount(confirmation);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, anonymised: result.anonymised });
}
