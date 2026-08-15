import { NextResponse } from "next/server";
import {
  searchListings,
  getListingsByIds,
} from "@/lib/data/listings";
import { parseFromURL } from "@/lib/data/search-params";
import { createListing } from "@/lib/data/listing-write";
import { getOrSyncUser } from "@/lib/data/users";
import { rateLimit, clientIp } from "@/lib/rate-limit";

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
  // Listing now requires a verified account (Emirates ID on file) — sign-in is
  // mandatory. Rate-limited per IP so it can't be used to spam the marketplace.
  const rl = rateLimit(`listings:${clientIp(req)}`, 8, 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Listing limit reached, try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return new NextResponse("Invalid JSON", { status: 400 });

  const user = await getOrSyncUser().catch(() => null);
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in and verify your Emirates ID to list a car." },
      { status: 401 },
    );
  }

  // A draft is private to its owner, so it skips the Emirates-ID gate — a
  // seller can park work in progress while their ID is still being verified.
  const asDraft = body.saveAsDraft === true;

  try {
    const created = await createListing(body, user, { asDraft });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create listing";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
