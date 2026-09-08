import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { partnerApplications } from "@/lib/db/schema";
import { isDbEnabled } from "@/lib/db/enabled";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * Public "apply to become a freight forwarder" form.
 *
 * Submitting this grants nothing. It creates a record for an admin to review,
 * who then issues an invitation. That separation is what keeps a privileged
 * partner role off the public sign-up page.
 */
export async function POST(req: Request) {
  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  // BUG FIXED: this read `if (!rateLimit(...))`. rateLimit returns a
  // RateLimitResult OBJECT, which is always truthy, so the negation was always
  // false and the limiter never fired — on the one endpoint that is public,
  // unauthenticated and writes to the database.
  const limit = rateLimit(`partner-apply:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many applications. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const body = await req.json().catch(() => null);
  const required = ["companyName", "contactName", "email"];
  for (const field of required) {
    if (!body || typeof body[field] !== "string" || !body[field].trim()) {
      return NextResponse.json(
        { error: "Company name, contact name and email are required." },
        { status: 400 },
      );
    }
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  await db.insert(partnerApplications).values({
    orgType: "forwarder",
    companyName: body.companyName.trim().slice(0, 200),
    contactName: body.contactName.trim().slice(0, 160),
    email: body.email.trim().toLowerCase().slice(0, 320),
    phone: typeof body.phone === "string" ? body.phone.slice(0, 32) : null,
    countryCode:
      typeof body.countryCode === "string" ? body.countryCode.slice(0, 2) : "AE",
    website: typeof body.website === "string" ? body.website.slice(0, 500) : null,
    message: typeof body.message === "string" ? body.message.slice(0, 4000) : null,
  });

  return NextResponse.json({ ok: true });
}
