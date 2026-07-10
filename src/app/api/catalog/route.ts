import { NextResponse } from "next/server";
import { getCatalogMakes, getCatalogModels, getCatalogModel } from "@/lib/data/catalog";

export const revalidate = 3600;

/**
 * GET /api/catalog                       → { makes }
 * GET /api/catalog?make=toyota           → { models } for that make
 * GET /api/catalog?make=toyota&model=land-cruiser → { model } detail w/ specs
 *
 * Public — powers the /new-cars pages and the sell-wizard make/model prefill.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const make = searchParams.get("make");
  const model = searchParams.get("model");

  if (make && model) {
    const detail = await getCatalogModel(make, model);
    if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ model: detail });
  }
  if (make) {
    const models = await getCatalogModels({ makeSlug: make, limit: 200 });
    return NextResponse.json({ models });
  }
  const makes = await getCatalogMakes();
  return NextResponse.json({ makes });
}
