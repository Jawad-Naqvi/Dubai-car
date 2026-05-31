import { NextResponse } from "next/server";
import { searchListings } from "@/lib/data/listings";
import { parseFromURL } from "@/lib/data/search-params";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = parseFromURL(url.searchParams);
  const result = await searchListings(params);

  return NextResponse.json({
    hits: result.items,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    facets: result.facets,
  });
}
