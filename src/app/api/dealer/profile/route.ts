import { NextResponse } from "next/server";
import { updateDealerProfile } from "@/lib/data/dealer-profile";

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return new NextResponse("Invalid JSON", { status: 400 });
  try {
    const ok = await updateDealerProfile(body);
    return NextResponse.json({ ok });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 422 },
    );
  }
}
