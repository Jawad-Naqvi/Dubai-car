import { NextResponse } from "next/server";
import { startBillingPortal } from "@/lib/data/payments";
import { getOrSyncUser } from "@/lib/data/users";

/** POST /api/payments/portal — open the Stripe customer billing portal. */
export async function POST() {
  const user = await getOrSyncUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  try {
    const result = await startBillingPortal();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not open billing portal" },
      { status: 422 },
    );
  }
}
