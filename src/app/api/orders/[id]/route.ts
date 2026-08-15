import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateOrderStatus, type OrderStatus } from "@/lib/data/orders";
import { getOrSyncUser } from "@/lib/data/users";

const ALLOWED: OrderStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

/** PATCH /api/orders/[id] — move an order along the pipeline. */
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
  const status = body.status as OrderStatus;
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Unknown status" }, { status: 400 });
  }
  // Buyers may only cancel; sellers/admins drive the rest of the pipeline.
  const isSeller = user.role === "dealer" || user.role === "admin";
  if (!isSeller && status !== "cancelled") {
    return NextResponse.json(
      { error: "Only the seller can update this order." },
      { status: 403 },
    );
  }

  const order = await updateOrderStatus(id, status);
  if (!order) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json({ order });
}
