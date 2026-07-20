import { NextResponse } from "next/server";
import { changePlan, isGatewayEnabled } from "@/lib/data/payments";
import { getOrSyncUser } from "@/lib/data/users";

export async function POST(req: Request) {
  // Was unauthenticated — anyone could grant themselves a paid plan. Require a
  // signed-in user; the plan is applied to their effective dealer account.
  const user = await getOrSyncUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.tier) {
    return NextResponse.json({ error: "tier required" }, { status: 400 });
  }
  try {
    const result = await changePlan(String(body.tier));
    return NextResponse.json({ ...result, gatewayLive: isGatewayEnabled() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Payment failed" },
      { status: 422 },
    );
  }
}
