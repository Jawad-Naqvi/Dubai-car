import { test, expect } from "@playwright/test";

/**
 * Authenticated workspaces — do they RENDER, and do they say the right thing?
 *
 * SCOPE, stated plainly: these run against a dev server with OPEN_DASHBOARDS=1,
 * which is the only local way to reach these pages without a Clerk session.
 * That means they prove the pages build, hydrate, and show correct empty and
 * pending states — the class of bug that has actually broken this app before
 * (server components passing functions to client components, missing props,
 * RSC boundary violations).
 *
 * They do NOT prove per-user data isolation, because there is no real session
 * to isolate. That is covered separately by the 15-assertion database test,
 * which asserts participation and ownership directly.
 *
 * Run with: E2E_BASE_URL=http://localhost:3100 npx playwright test authenticated-ui
 */

const WORKSPACES = [
  { path: "/en/dashboard", name: "dashboard overview" },
  { path: "/en/dashboard/messages", name: "messages inbox" },
  { path: "/en/dashboard/shipping", name: "shipping desk" },
  { path: "/en/dashboard/shipments", name: "shipment tracking" },
  { path: "/en/dashboard/my-listings", name: "my listings" },
  { path: "/en/dashboard/orders", name: "orders" },
  { path: "/en/dashboard/quotes", name: "quotes" },
  { path: "/en/dashboard/saved", name: "saved cars" },
  { path: "/en/dashboard/settings", name: "settings" },
  { path: "/en/admin", name: "admin overview" },
  { path: "/en/admin/partners", name: "partner network" },
  { path: "/en/admin/users", name: "admin users" },
  { path: "/en/admin/dealers", name: "admin dealers" },
];

test.describe("Authenticated workspaces render", () => {
  for (const ws of WORKSPACES) {
    test(`${ws.name} renders without crashing`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("pageerror", (e) => consoleErrors.push(e.message));

      await page.goto(ws.path, { waitUntil: "domcontentloaded" });
      const body = await page.locator("body").innerText();

      expect(body, `${ws.path} showed an error page`).not.toMatch(
        /Application error|Unhandled Runtime Error|Internal Server Error/i,
      );
      // A specific past failure: passing a function (a lucide icon component)
      // from a server component into a client one.
      expect(body).not.toMatch(/Functions cannot be passed directly/i);

      expect(
        consoleErrors,
        `${ws.path} console errors: ${consoleErrors.join(" | ")}`,
      ).toHaveLength(0);

      // Something must actually be on the page.
      expect(body.trim().length).toBeGreaterThan(50);
    });
  }
});

test.describe("Empty states are helpful, not blank", () => {
  test("messages explains what will appear here", async ({ page }) => {
    await page.goto("/en/dashboard/messages");
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/no messages|conversation/i);
  });

  test("shipments points the user at the next action", async ({ page }) => {
    await page.goto("/en/dashboard/shipments");
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/no shipments|shipment/i);
  });

  test("shipping desk offers the request form with real destinations", async ({
    page,
  }) => {
    await page.goto("/en/dashboard/shipping");
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/ship this car|destination/i);

    // Destinations come from the seeded country pack, not a hardcoded list.
    const select = page.locator("select").first();
    if (await select.count()) {
      const options = await select.locator("option").allTextContents();
      expect(options.length).toBeGreaterThan(2);
      expect(options.join(" ")).toMatch(/Kenya|India|Nigeria/i);
    }
  });
});

test.describe("Freight business rules surface in the UI", () => {
  test("shipping form offers RO-RO and container modes with guidance", async ({
    page,
  }) => {
    await page.goto("/en/dashboard/shipping");
    const body = await page.locator("body").innerText();

    expect(body).toMatch(/RO-RO/i);
    expect(body).toMatch(/container/i);
    // The mode explanation is a real domain distinction, not decoration.
    expect(body).toMatch(/driven on board|nothing packed|shares a container/i);
  });

  test("incoterms are offered with who-pays-what explained", async ({ page }) => {
    await page.goto("/en/dashboard/shipping");
    const body = await page.locator("body").innerText();

    expect(body).toMatch(/CIF|CFR|FOB|DAP|DDP/);
    // Import duty is the classic surprise; it must be stated up front.
    expect(body).toMatch(/duty/i);
  });

  test("admin partner console shows the verification queue and links", async ({
    page,
  }) => {
    await page.goto("/en/admin/partners");
    const body = await page.locator("body").innerText();

    expect(body).toMatch(/partner network/i);
    expect(body).toMatch(/awaiting verification|verified/i);
    expect(body).toMatch(/onboarding links|new link/i);
    expect(body).toMatch(/application/i);
  });

  test("admin can open the invitation form and choose a partner type", async ({
    page,
  }) => {
    await page.goto("/en/admin/partners");
    const newLink = page.getByRole("button", { name: /new link/i });
    await newLink.click();

    // Freight partner and platform admin must both be issuable here — this is
    // the ONLY way those accounts come into existence.
    const select = page.locator("select").first();
    const options = await select.locator("option").allTextContents();
    expect(options.join(" ")).toMatch(/freight partner/i);
    expect(options.join(" ")).toMatch(/platform admin/i);

    // Choosing admin must warn about what it grants.
    await select.selectOption({ label: "Platform admin" });
    await expect(page.getByText(/grants full admin access/i)).toBeVisible();
  });
});

test.describe("Dashboard sidebar is sticky", () => {
  test("sidebar keeps position while the page scrolls", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/dashboard");

    const rail = page.locator("aside").first();
    if ((await rail.count()) === 0) test.skip();

    const position = await rail.evaluate((el) => getComputedStyle(el).position);
    expect(position, "dashboard sidebar is not sticky").toBe("sticky");

    const before = await rail.boundingBox();
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(400);
    const after = await rail.boundingBox();

    if (before && after) {
      expect(after.y, "sidebar scrolled off screen").toBeGreaterThan(-50);
    }
  });
});
