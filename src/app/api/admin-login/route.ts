import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE = "dxb_admin";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const pin = String(body?.pin ?? "");
  const expected = process.env.ADMIN_PIN ?? "1234";
  const token = process.env.ADMIN_SESSION_TOKEN ?? "dxb-admin";

  if (pin !== expected) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
    secure: false, // localhost is http; set true behind HTTPS in production
  });
  return NextResponse.json({ ok: true });
}

// Lock / sign out of the admin panel.
export async function DELETE() {
  const jar = await cookies();
  jar.delete(COOKIE);
  return NextResponse.json({ ok: true });
}
