import { NextResponse } from "next/server";
import { registerB2BBuyer } from "@/lib/data/b2b";
import { getOrSyncUser } from "@/lib/data/users";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return new NextResponse("Invalid JSON", { status: 400 });

  const user = await getOrSyncUser().catch(() => null);
  try {
    const { id } = await registerB2BBuyer(body, user ?? undefined);
    return NextResponse.json({ id, status: "pending_verification" }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Registration failed" },
      { status: 422 },
    );
  }
}
