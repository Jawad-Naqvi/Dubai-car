import { NextResponse } from "next/server";
import { getShipment, recordMilestone } from "@/lib/data/freight";

export const dynamic = "force-dynamic";

/** The shipment with its full event timeline — participants only. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const shipment = await getShipment(id);
  if (!shipment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ shipment });
}

/**
 * Records a milestone. Only the assigned forwarder or a platform admin may
 * post; the check lives in recordMilestone so it cannot be skipped by a
 * different caller.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.milestone !== "string") {
    return NextResponse.json({ error: "Milestone is required." }, { status: 400 });
  }

  const eventAt = body.eventAt ? new Date(body.eventAt) : new Date();
  if (Number.isNaN(eventAt.getTime())) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  const classifier =
    body.classifier === "EST" || body.classifier === "PLN"
      ? body.classifier
      : "ACT";

  const result = await recordMilestone({
    shipmentId: id,
    milestone: body.milestone,
    classifier,
    eventAt,
    location: typeof body.location === "string" ? body.location : undefined,
    note: typeof body.note === "string" ? body.note : undefined,
  });

  if (!result.ok) {
    const status = result.error === "Not allowed" ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true });
}
