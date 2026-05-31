import { NextResponse } from "next/server";
import { changePlan, isGatewayEnabled } from "@/lib/data/payments";

export async function POST(req: Request) {
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
