import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ZodError } from "zod";
import {
  acceptQuote,
  declineQuote,
  getQuoteById,
  respondToQuote,
  markQuoteUnderReview,
} from "@/lib/data/quotes";
import { getOrSyncUser } from "@/lib/data/users";

/**
 * PATCH /api/quotes/[id] — drive the quote lifecycle.
 *
 * body.action:
 *   "respond"  (seller) → price the request        requested/under_review → responded
 *   "accept"   (buyer)  → accept + create an order responded              → accepted
 *   "decline"  (either) → withdraw or decline      any open state          → withdrawn/declined
 *   "review"   (seller) → mark as opened           requested              → under_review
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const user = await getOrSyncUser().catch(() => null);
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as string | undefined;

  try {
    switch (action) {
      case "respond": {
        const quote = await respondToQuote(id, body);
        if (!quote) return new NextResponse("Not found", { status: 404 });
        return NextResponse.json({ quote });
      }
      case "accept": {
        const result = await acceptQuote(id, user.id);
        if (!result) return new NextResponse("Not found", { status: 404 });
        return NextResponse.json({
          quote: result.quote,
          orderReference: result.orderReference,
        });
      }
      case "decline": {
        const by = body.by === "seller" ? "seller" : "buyer";
        const quote = await declineQuote(id, by, body.reason);
        if (!quote) return new NextResponse("Not found", { status: 404 });
        return NextResponse.json({ quote });
      }
      case "review": {
        await markQuoteUnderReview(id);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid input" },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not update quote" },
      { status: 400 },
    );
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  const quote = await getQuoteById(id);
  if (!quote) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json({ quote });
}
