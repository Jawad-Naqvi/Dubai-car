import { NextResponse } from "next/server";
import {
  createFreightRequest,
  getMyFreightRequests,
  type Incoterm,
  type ShipmentMode,
} from "@/lib/data/freight";

export const dynamic = "force-dynamic";

const MODES: ShipmentMode[] = ["roro", "container_fcl", "container_lcl", "air"];
const INCOTERMS: Incoterm[] = ["EXW", "FOB", "CFR", "CIF", "DAP", "DDP"];

/** The buyer's own shipping requests and the bids received. */
export async function GET() {
  const requests = await getMyFreightRequests();
  return NextResponse.json({ requests });
}

/** Raises a shipping request and fans it out to matching forwarders. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.destCountry !== "string") {
    return NextResponse.json(
      { error: "Choose a destination country." },
      { status: 400 },
    );
  }

  const mode: ShipmentMode = MODES.includes(body.mode) ? body.mode : "roro";
  const incoterm: Incoterm = INCOTERMS.includes(body.incoterm)
    ? body.incoterm
    : "CIF";

  const result = await createFreightRequest({
    orderId: typeof body.orderId === "string" ? body.orderId : undefined,
    originCountry:
      typeof body.originCountry === "string" ? body.originCountry : undefined,
    originCity: typeof body.originCity === "string" ? body.originCity : undefined,
    destCountry: body.destCountry,
    destCity: typeof body.destCity === "string" ? body.destCity : undefined,
    destPort: typeof body.destPort === "string" ? body.destPort : undefined,
    mode,
    incoterm,
    vehicleCount:
      typeof body.vehicleCount === "number" ? body.vehicleCount : undefined,
    vehicleSummary: body.vehicleSummary ?? undefined,
    notes: typeof body.notes === "string" ? body.notes : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: result.id, invited: result.invited });
}
