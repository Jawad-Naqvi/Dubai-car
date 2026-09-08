import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import { isDbEnabled } from "./lib/db/enabled";

const handleI18nRouting = createIntlMiddleware(routing);

/**
 * ONE FRONT DOOR.
 *
 * There is a single sign-in page for every kind of account. Buyers, dealers,
 * freight forwarders and platform admins all authenticate through Clerk at
 * /sign-in; what differs afterwards is only where /post-auth sends them and
 * what their organization is allowed to do.
 *
 * This replaces a second, parallel login: /admin-login accepted a 4-digit PIN
 * (defaulting to "1234") and set a static `dxb_admin` cookie whose expected
 * value defaulted to the literal string "dxb-admin". Anyone could set that
 * cookie by hand and read the whole admin console — the user table, dealer KYC
 * status and revenue — with no account at all. Admin is now a role on a real
 * signed-in identity, granted by invitation, and revocable.
 */

// Local-only convenience. Never loosens anything in a production build.
const DEV_OPEN =
  process.env.NODE_ENV !== "production" &&
  (!isDbEnabled() || process.env.OPEN_DASHBOARDS === "true");

const isProtectedRoute = createRouteMatcher([
  "/(.*)/dashboard(.*)",
  "/dashboard(.*)",
  "/(.*)/admin(.*)",
  "/admin(.*)",
]);

const isAdminRoute = createRouteMatcher(["/(.*)/admin(.*)", "/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // API routes: Clerk context is available (so auth() works in handlers),
  // but they must NOT pass through next-intl locale routing.
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const locale = pathname.split("/")[1] || "en";

  if (isProtectedRoute(req) && !DEV_OPEN) {
    const { userId, sessionClaims, redirectToSignIn } = await auth();

    // Not signed in: everyone goes to the same sign-in page.
    if (!userId) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    // Signed in but not an admin: /admin/* is simply not their area. Send them
    // to their own dashboard rather than a login prompt they cannot satisfy.
    if (isAdminRoute(req)) {
      const role = (sessionClaims?.metadata as { role?: string } | undefined)
        ?.role;
      if (role !== "admin") {
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
      }
    }
  }

  return handleI18nRouting(req);
});

export const config = {
  matcher: [
    // Run on everything except Next internals and static files…
    "/((?!_next|_vercel|.*\\..*).*)",
    "/",
    // …and explicitly include API routes so auth() has Clerk context.
    "/(api|trpc)(.*)",
  ],
};
