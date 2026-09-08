import { NextResponse } from "next/server";
import { awardFreightQuote, submitFreightQuote } from "@/lib/data/freight";

/**
 * PATCH submits a bid (forwarder). POST awards it (buyer). Both verify the
 * caller against the record server-side — the action is not taken on trust
 * from the request body.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.totalMinor !== "number" || !body.validUntil) {
    return NextResponse.json(
      { error: "Enter a total and a validity date." },
      { status: 400 },
    );
  }

  const validUntil = new Date(body.validUntil);
  if (Number.isNaN(validUntil.getTime())) {
    return NextResponse.json({ error: "Invalid validity date." }, { status: 400 });
  }

  const result = await submitFreightQuote({
    quoteId: id,
    totalMinor: body.totalMinor,
    currency: typeof body.currency === "string" ? body.currency : undefined,
    lineItems: body.lineItems ?? undefined,
    transitDays:
      typeof body.transitDays === "number" ? body.transitDays : undefined,
    validUntil,
    notes: typeof body.notes === "string" ? body.notes : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await awardFreightQuote(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, shipmentId: result.shipmentId });
}
