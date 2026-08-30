import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { addQuoteMessage } from "@/lib/data/quotes";
import { getOrSyncUser } from "@/lib/data/users";

/** POST /api/quotes/[id]/messages — negotiation thread on a quote. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const user = await getOrSyncUser().catch(() => null);
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const text = String(body.body ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Message is required" }, { status: 422 });
  }

  // A dealer/admin account posts as the seller side of the thread.
  const from =
    user.role === "dealer" || user.role === "admin" ? "dealer" : "buyer";
  const message = await addQuoteMessage(id, from, text.slice(0, 4000));
  if (!message) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json({ message }, { status: 201 });
}
