import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createLead } from "@/lib/data/leads";
import { getOrSyncUser } from "@/lib/data/users";
import { ownsListing, OWN_LISTING_ERROR } from "@/lib/data/ownership";

export async function POST(req: Request) {
  const { userId } = await auth();
  const body = await req.json().catch(() => null);
  if (!body) return new NextResponse("Invalid JSON", { status: 400 });

  if (!body.buyerName || (!body.buyerPhone && !body.buyerEmail)) {
    return NextResponse.json(
      { error: "Name and a phone or email are required." },
      { status: 422 },
    );
  }

  // Resolve the internal buyer record if the visitor is signed in.
  let buyerId: string | undefined;
  if (userId) {
    const u = await getOrSyncUser();
    buyerId = u?.id;
  }

  // You can't enquire on your own car — it would create a lead and a
  // conversation with yourself.
  if (await ownsListing(body.listingId, buyerId)) {
    return NextResponse.json({ error: OWN_LISTING_ERROR }, { status: 409 });
  }

  const { id } = await createLead({
    listingId: body.listingId,
    buyerId,
    type: body.type ?? "inquiry",
    buyerName: body.buyerName,
    buyerEmail: body.buyerEmail,
    buyerPhone: body.buyerPhone,
    message: body.message,
    destinationCountry: body.destinationCountry,
    quantity: body.quantity,
    shippingPreference: body.shippingPreference,
  });

  return NextResponse.json({ id, status: "new" }, { status: 201 });
}
