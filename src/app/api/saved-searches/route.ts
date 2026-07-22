import { NextResponse } from "next/server";
import { getOrSyncUser } from "@/lib/data/users";
import {
  createSavedSearch,
  listSavedSearches,
  deleteSavedSearch,
  type Frequency,
} from "@/lib/data/saved-searches";

export const runtime = "nodejs";

const FREQS: Frequency[] = ["instant", "daily", "weekly"];

/** GET /api/saved-searches → the signed-in user's saved searches. */
export async function GET() {
  const user = await getOrSyncUser();
  if (!user) return NextResponse.json({ searches: [] });
  return NextResponse.json({ searches: await listSavedSearches(user.id) });
}

/**
 * POST /api/saved-searches
 *  { name, query: Record<string,string>, frequency } → create one.
 * Returns the updated list.
 */
export async function POST(req: Request) {
  const user = await getOrSyncUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim() || "Saved search";
  const query =
    body.query && typeof body.query === "object" ? body.query : {};
  const frequency: Frequency = FREQS.includes(body.frequency)
    ? body.frequency
    : "daily";

  await createSavedSearch(user.id, { name, query, frequency });
  return NextResponse.json({ searches: await listSavedSearches(user.id) });
}

/** DELETE /api/saved-searches?id=... → remove one. Returns the updated list. */
export async function DELETE(req: Request) {
  const user = await getOrSyncUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteSavedSearch(user.id, id);
  return NextResponse.json({ searches: await listSavedSearches(user.id) });
}
