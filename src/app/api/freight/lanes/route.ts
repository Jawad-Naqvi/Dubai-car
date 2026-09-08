import { NextResponse } from "next/server";
import { addForwarderLane, type ShipmentMode } from "@/lib/data/freight";

const MODES: ShipmentMode[] = ["roro", "container_fcl", "container_lcl", "air"];

/** Registers a corridor the forwarder serves. Org membership is verified. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.orgId !== "string" ||
    typeof body.originCountry !== "string" ||
    typeof body.destCountry !== "string"
  ) {
    return NextResponse.json({ error: "Choose a route." }, { status: 400 });
  }

  const result = await addForwarderLane({
    orgId: body.orgId,
    originCountry: body.originCountry.slice(0, 2).toUpperCase(),
    destCountry: body.destCountry.slice(0, 2).toUpperCase(),
    mode: MODES.includes(body.mode) ? body.mode : "roro",
    transitDays:
      typeof body.transitDays === "number" ? body.transitDays : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}
