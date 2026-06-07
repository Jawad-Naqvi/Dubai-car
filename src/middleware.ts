import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import { isDbEnabled } from "./lib/db/enabled";

const handleI18nRouting = createIntlMiddleware(routing);

// Dashboard/admin areas are open when there's no real DB (demo) or when
// OPEN_DASHBOARDS=true (testing against a live DB). In production with the flag
// off, full Clerk auth + role gating below applies.
const DEMO_MODE = !isDbEnabled() || process.env.OPEN_DASHBOARDS === "true";

const isProtectedRoute = createRouteMatcher([
  "/(.*)/dashboard(.*)",
  "/dashboard(.*)",
  "/(.*)/admin(.*)",
  "/admin(.*)",
]);

const isAdminRoute = createRouteMatcher(["/(.*)/admin(.*)", "/admin(.*)"]);

const ADMIN_COOKIE = "dxb_admin";

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // API routes: Clerk context is available (so auth() works in handlers),
  // but they must NOT pass through next-intl locale routing.
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const locale = pathname.split("/")[1] || "en";
  const isAdminLogin = pathname.includes("/admin-login");

  // --- Admin PIN gate: /admin/* requires a valid admin PIN cookie ---
  if (isAdminRoute(req) && !isAdminLogin) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    const expected = process.env.ADMIN_SESSION_TOKEN ?? "dxb-admin";
    if (!token || token !== expected) {
      return NextResponse.redirect(new URL(`/${locale}/admin-login`, req.url));
    }
  }

  // --- Dealer dashboard gate (Clerk) — admin handled by PIN above ---
  if (!DEMO_MODE && isProtectedRoute(req) && !isAdminRoute(req)) {
    const { userId, redirectToSignIn } = await auth();
    if (!userId) {
      return redirectToSignIn({ returnBackUrl: req.url });
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
