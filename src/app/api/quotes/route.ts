import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ZodError } from "zod";
import {
  createQuoteRequest,
  getQuotesForBuyer,
  getQuotesForDealer,
} from "@/lib/data/quotes";
import { getOrSyncUser, getCurrentDealer } from "@/lib/data/users";
import { ownsListing, OWN_LISTING_ERROR } from "@/lib/data/ownership";

/**
 * POST /api/quotes — raise a quotation request.
 * Open to signed-out visitors (they supply contact details), exactly like the
 * B2C enquiry form: bulk buyers shouldn't have to create an account to ask.
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
    const { id, reference } = await createQuoteRequest(body, buyerId);
    return NextResponse.json({ id, reference, status: "requested" }, { status: 201 });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid request" },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not submit request" },
      { status: 400 },
    );
  }
}

/** GET /api/quotes?role=buyer|seller — the caller's own quotes. */
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const user = await getOrSyncUser().catch(() => null);
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const role = new URL(req.url).searchParams.get("role") ?? "buyer";
  if (role === "seller") {
    const dealer = await getCurrentDealer().catch(() => null);
    const quotes = await getQuotesForDealer(dealer?.id, user.id);
    return NextResponse.json({ quotes });
  }
  const quotes = await getQuotesForBuyer(user.id);
  return NextResponse.json({ quotes });
}
