import { NextResponse } from "next/server";
import { chooseAccountType } from "@/lib/data/onboarding";

/** Records what the signed-in user is here to do (buyer or dealer only). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.type !== "string") {
    return NextResponse.json({ error: "Choose an account type." }, { status: 400 });
  }

  const result = await chooseAccountType({
    type: body.type,
    organizationName:
      typeof body.organizationName === "string" ? body.organizationName : undefined,
    countryCode: typeof body.countryCode === "string" ? body.countryCode : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, orgId: result.orgId, type: result.type });
}
