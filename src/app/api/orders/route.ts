import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ZodError } from "zod";
import {
  createRetailOrder,
  getOrdersForBuyer,
  getOrdersForDealer,
} from "@/lib/data/orders";
import { getOrSyncUser, getCurrentDealer } from "@/lib/data/users";
import { ownsListing, OWN_LISTING_ERROR } from "@/lib/data/ownership";

/**
 * POST /api/orders — B2C reservation on a priced listing. Mirrors the quote
 * flow's openness: contact details are enough, no account required.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  const body = await req.json().catch(() => null);
  if (!body) return new NextResponse("Invalid JSON", { status: 400 });

  let buyerId: string | undefined;
  if (userId) {
    const u = await getOrSyncUser().catch(() => null);
    buyerId = u?.id;
  }

  if (await ownsListing(body.listingId, buyerId)) {
    return NextResponse.json({ error: OWN_LISTING_ERROR }, { status: 409 });
  }

  try {
    const order = await createRetailOrder(body, buyerId);
    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid request" },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not place order" },
      { status: 400 },
    );
  }
}

/** GET /api/orders?role=buyer|seller */
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const user = await getOrSyncUser().catch(() => null);
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const role = new URL(req.url).searchParams.get("role") ?? "buyer";
  if (role === "seller") {
    const dealer = await getCurrentDealer().catch(() => null);
    return NextResponse.json({ orders: await getOrdersForDealer(dealer?.id, user.id) });
  }
  return NextResponse.json({ orders: await getOrdersForBuyer(user.id) });
}
