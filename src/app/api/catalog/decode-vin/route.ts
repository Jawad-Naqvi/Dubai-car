import { NextResponse } from "next/server";
import { decodeVin } from "@/lib/catalog/providers";

/**
 * GET /api/catalog/decode-vin?vin=WP0AF2A99KS165242 → { make, model, year, type }
 *
 * Public — powers the "Decode from VIN" auto-fill in the sell wizard. The
 * auto.dev API key stays server-side; the client only ever sees this route.
 * Returns 404 when auto.dev isn't configured or the VIN can't be decoded, so
 * the wizard can fall back to manual entry without treating it as an error.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vin = searchParams.get("vin");
  if (!vin) {
    return NextResponse.json({ error: "vin is required" }, { status: 400 });
  }
  const result = await decodeVin(vin);
  if (!result || !result.make) {
    return NextResponse.json({ error: "Could not decode this VIN" }, { status: 404 });
  }
  return NextResponse.json(result);
}
