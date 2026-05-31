import { NextResponse } from "next/server";
import { valuateAndStore } from "@/lib/data/valuation";
import { getOrSyncUser } from "@/lib/data/users";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.make || !body?.year) {
    return NextResponse.json(
      { error: "make and year are required" },
      { status: 422 },
    );
  }

  const user = await getOrSyncUser().catch(() => null);

  const result = await valuateAndStore(
    {
      make: String(body.make),
      model: String(body.model ?? ""),
      year: Number(body.year),
      kms: Number(body.kms ?? 0),
      condition: String(body.condition ?? "Used"),
    },
    user?.id,
  );

  return NextResponse.json(result);
}
