import { NextResponse } from "next/server";
import { addLeadReply, getLeadOwnership } from "@/lib/data/leads";
import { getOrSyncUser, getCurrentDealer, isAdminAllowed, dashboardsOpen } from "@/lib/data/users";

/**
 * POST /api/leads/[id]/reply — either party on a lead thread (the buyer who
 * opened it, or the dealer it's routed to) can send a reply. Notifies the
 * other party by email.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "Reply text required" }, { status: 400 });

  const ownership = await getLeadOwnership(id);
  if (!ownership) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const admin = await isAdminAllowed();
  const user = await getOrSyncUser();
  const dealer = await getCurrentDealer();

  let senderRole: "buyer" | "dealer" | null = null;
  if (dealer && ownership.dealerId === dealer.id) senderRole = "dealer";
  else if (user && ownership.buyerId === user.id) senderRole = "buyer";
  else if (admin || dashboardsOpen()) senderRole = dealer ? "dealer" : "buyer";

  if (!senderRole) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await addLeadReply(id, senderRole, text);
  return NextResponse.json({ ok: true });
}
