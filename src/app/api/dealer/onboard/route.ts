import { NextResponse } from "next/server";
import { becomeDealer } from "@/lib/data/dealer-onboard";

/** POST /api/dealer/onboard — promote the signed-in user to a dealer/seller. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return new NextResponse("Invalid JSON", { status: 400 });
  try {
    const result = await becomeDealer(body);
    return NextResponse.json(result, { status: result.ok ? 201 : 422 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Onboarding failed" },
      { status: 422 },
    );
  }
}
