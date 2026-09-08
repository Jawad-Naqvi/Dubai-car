import { test, expect } from "@playwright/test";

/**
 * The security guarantees, exercised as a hostile visitor.
 *
 * Every assertion here corresponds to a real defect that existed in this
 * codebase: a second PIN login with a forgeable cookie, an env flag that
 * disabled authorization globally, identity documents served with no auth, and
 * a lead query that returned every dealer's buyer contacts. These tests exist
 * so those cannot come back silently.
 *
 * MUST run against the PRODUCTION server. In dev with OPEN_DASHBOARDS the
 * bypasses are intentionally open and these would fail for the right reason.
 */

const PROTECTED_PAGES = [
  "/en/dashboard",
  "/en/dashboard/messages",
  "/en/dashboard/leads",
  "/en/dashboard/shipping",
  "/en/dashboard/shipments",
  "/en/dashboard/freight",
  "/en/dashboard/my-listings",
  "/en/admin",
  "/en/admin/partners",
  "/en/admin/users",
];

test.describe("Authentication boundaries", () => {
  for (const path of PROTECTED_PAGES) {
    test(`anonymous cannot reach ${path}`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });

      // Either bounced to sign-in, or served a page that shows no private data.
      const url = page.url();
      const redirected = /sign-in|sign-up|accounts\./i.test(url);
      expect(
        redirected,
        `${path} did not require authentication (landed on ${url}, status ${res?.status()})`,
      ).toBeTruthy();
    });
  }

  test("the second login (/admin-login) no longer exists", async ({ request }) => {
    // It accepted a 4-digit PIN defaulting to "1234" and set a static cookie
    // whose expected value defaulted to the literal "dxb-admin".
    const api = await request.post("/api/admin-login", {
      data: { pin: "1234" },
      failOnStatusCode: false,
    });
    expect(api.status(), "PIN endpoint is still reachable").toBe(404);
  });

  test("forging the old admin cookie grants nothing", async ({ browser }) => {
    const ctx = await browser.newContext();
    await ctx.addCookies([
      {
        name: "dxb_admin",
        value: "dxb-admin", // the old default
        domain: "localhost",
        path: "/",
      },
    ]);
    const page = await ctx.newPage();
    await page.goto("/en/admin", { waitUntil: "domcontentloaded" });

    expect(
      /sign-in|sign-up|accounts\./i.test(page.url()),
      "the forged cookie still opened the admin console",
    ).toBeTruthy();
    await ctx.close();
  });
});

test.describe("API returns no data to anonymous callers", () => {
  test("chat inbox is empty, not populated", async ({ request }) => {
    const res = await request.get("/api/chat/conversations");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.conversations, "anonymous caller received conversations").toEqual([]);
    expect(body.unread).toBe(0);
  });

  test("freight requests are empty, not populated", async ({ request }) => {
    const res = await request.get("/api/freight/requests");
    const body = await res.json();
    expect(body.requests, "anonymous caller received freight requests").toEqual([]);
  });

  test("account messages are empty", async ({ request }) => {
    const res = await request.get("/api/account/messages");
    const body = await res.json();
    expect(body.threads ?? []).toEqual([]);
  });

  test("admin endpoints refuse anonymous callers", async ({ request }) => {
    for (const url of ["/api/admin/invitations", "/api/admin/reports"]) {
      const res = await request.get(url, { failOnStatusCode: false });
      expect([401, 403, 404], `${url} returned ${res.status()}`).toContain(
        res.status(),
      );
    }
  });

  test("cannot escalate own role through the admin user endpoint", async ({
    request,
  }) => {
    const res = await request.patch(
      "/api/admin/users/00000000-0000-0000-0000-000000000000",
      { data: { role: "admin" }, failOnStatusCode: false },
    );
    expect([401, 403, 404]).toContain(res.status());
  });

  test("cannot self-assign a privileged role during onboarding", async ({
    request,
  }) => {
    // Freight forwarder and platform admin exist only behind an invitation.
    for (const type of ["forwarder", "platform", "admin"]) {
      const res = await request.post("/api/onboarding/choose", {
        data: { type },
        failOnStatusCode: false,
      });
      expect(
        res.status(),
        `onboarding accepted a privileged type "${type}"`,
      ).not.toBe(200);
    }
  });
});

test.describe("Private media is not publicly served", () => {
  test("a random media id does not leak bytes", async ({ request }) => {
    const res = await request.get(
      "/api/media/00000000-0000-0000-0000-000000000000",
      { failOnStatusCode: false },
    );
    expect(res.status()).toBe(404);
  });

  test("listing images are still publicly cacheable", async ({ page, request }) => {
    await page.goto("/en/buy");
    const src = await page
      .locator('img[src*="/api/media/"]')
      .first()
      .getAttribute("src")
      .catch(() => null);

    if (!src) {
      test.info().annotations.push({
        type: "note",
        description: "No DB-backed listing images on this page (remote URLs).",
      });
      return;
    }
    const res = await request.get(src, { failOnStatusCode: false });
    expect(res.status()).toBe(200);
    // Public assets keep the immutable cache header; private ones must not.
    expect(res.headers()["cache-control"] ?? "").toContain("public");
  });
});

test.describe("Invitation tokens", () => {
  test("an invalid token is refused with a generic message", async ({ page }) => {
    await page.goto("/en/join/not-a-real-token");
    const body = await page.locator("body").innerText();

    expect(body).toMatch(/isn't valid|not valid|expired/i);
    // Must not disclose whether the token was unknown vs already used.
    expect(body).not.toMatch(/already been used by/i);
    // And must not have created anything.
    expect(body).not.toMatch(/accept invitation/i);
  });
});
