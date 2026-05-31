import { NextResponse } from "next/server";
import {
  searchListings,
  getListingsByIds,
} from "@/lib/data/listings";
import { parseFromURL } from "@/lib/data/search-params";
import { createListing } from "@/lib/data/listing-write";
import { getOrSyncUser } from "@/lib/data/users";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const idsParam = url.searchParams.get("ids");
  if (idsParam) {
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    const items = await getListingsByIds(ids);
    return NextResponse.json({ items, total: items.length });
  }
  const result = await searchListings(parseFromURL(url.searchParams));
  return NextResponse.json({ items: result.items, total: result.total });
}

export async function POST(req: Request) {
  // Listing is open to guests (private sellers); we attach the user when signed
  // in so dealers get ownership + quota tracking. Tighten this in production if
  // you require accounts to list.
  const body = await req.json().catch(() => null);
  if (!body) return new NextResponse("Invalid JSON", { status: 400 });

  const user = await getOrSyncUser().catch(() => null);

  try {
    const created = await createListing(body, user ?? undefined);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create listing";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
