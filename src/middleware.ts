import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import { isDbEnabled } from "./lib/db/enabled";

const handleI18nRouting = createIntlMiddleware(routing);

// Demo mode: with no real database wired, the dashboard/admin areas are open so
// the whole product can be explored locally without configuring Clerk roles.
// In production (real DB), full auth + role gating below applies.
const DEMO_MODE = !isDbEnabled();

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

  if (!DEMO_MODE && isProtectedRoute(req)) {
    const { userId, sessionClaims, redirectToSignIn } = await auth();

    if (!userId) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    if (isAdminRoute(req)) {
      const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;
      if (role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
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
