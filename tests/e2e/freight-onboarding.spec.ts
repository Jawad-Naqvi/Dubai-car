import { test, expect } from "@playwright/test";

/**
 * Freight partner onboarding and the layout fixes.
 *
 * The business rule under test: a freight forwarder can NEVER self-serve into
 * an account. They apply publicly, an admin reviews, and an admin sends a
 * private link. So the public surface must accept an application and grant
 * nothing.
 */

test.describe("Freight partner application", () => {
  test("the public page explains the invite-only process", async ({ page }) => {
    await page.goto("/en/partners/apply");

    await expect(page.locator("h1")).toContainText(/move cars|partner/i);
    const body = await page.locator("body").innerText();

    // The four-step process must be stated, so applicants aren't left guessing.
    expect(body).toMatch(/apply/i);
    expect(body).toMatch(/review/i);
    expect(body).toMatch(/onboarding link|link/i);
  });

  test("the form rejects an incomplete application", async ({ page }) => {
    await page.goto("/en/partners/apply");
    await page.getByRole("button", { name: /send application/i }).click();

    // Should surface an error rather than silently doing nothing.
    await expect(
      page.getByText(/required|company name/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("a complete application is accepted and confirms", async ({ page }) => {
    await page.goto("/en/partners/apply");

    const stamp = Date.now();
    await page.getByPlaceholder(/registered name/i).fill(`E2E Freight ${stamp}`);
    await page.getByPlaceholder(/full name/i).fill("E2E Tester");
    await page.getByPlaceholder(/you@company\.com/i).fill(`e2e-${stamp}@example.com`);
    await page
      .getByPlaceholder(/Jebel Ali to Mombasa/i)
      .fill("Jebel Ali to Mombasa, RO-RO and consolidated containers.");

    await page.getByRole("button", { name: /send application/i }).click();

    // The endpoint is rate limited to a handful of submissions per IP per
    // hour, and enterprise.spec.ts deliberately exhausts that budget to prove
    // the limiter fires. A 429 here is therefore the limiter working, not a
    // broken form — so accept either outcome, but require ONE of them rather
    // than letting a silent no-op pass.
    const accepted = page.getByText(/application received/i);
    const limited = page.getByText(/too many applications/i);
    await expect(accepted.or(limited)).toBeVisible({ timeout: 20_000 });

    if (await limited.isVisible()) {
      test.info().annotations.push({
        type: "note",
        description:
          "Rate limited by the earlier limiter test — submission path not exercised this run.",
      });
    }

    // Critically: applying must NOT have signed them in or created access.
    await page.goto("/en/dashboard/freight", { waitUntil: "domcontentloaded" });
    expect(
      /sign-in|sign-up|accounts\./i.test(page.url()),
      "applying granted access to the freight workspace",
    ).toBeTruthy();
  });

  test("sign-up never offers a freight forwarder option", async ({ page }) => {
    await page.goto("/en/sign-up");
    const body = await page.locator("body").innerText();
    // Buyers and dealers self-serve; partners do not.
    expect(body).not.toMatch(/i'?m a freight forwarder|sign up as a forwarder/i);
  });
});

test.describe("Single sign-in surface", () => {
  test("the sign-in page offers no separate admin login", async ({ page }) => {
    await page.goto("/en/sign-in");
    const body = await page.locator("body").innerText();

    expect(body, "a second 'Admin login' door is still advertised").not.toMatch(
      /admin login/i,
    );
    // One door, plus a route to create an account.
    expect(body).toMatch(/create an account|sign up/i);
  });
});

test.describe("Sticky layout regression", () => {
  test("the /buy filter rail is sticky, not scrolled away", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/buy");

    const rail = page.locator("aside").first();
    await expect(rail).toBeVisible();

    // The bug was CSS, not markup: the class was present but body's overflow-x
    // made body a scroll container, so nothing could stick.
    const position = await rail.evaluate(
      (el) => getComputedStyle(el).position,
    );
    expect(position, "filter rail lost its sticky positioning").toBe("sticky");

    // And body must not be a scroll container.
    const bodyOverflowX = await page.evaluate(
      () => getComputedStyle(document.body).overflowX,
    );
    expect(
      bodyOverflowX,
      "body has overflow-x again — this silently breaks every sticky descendant",
    ).not.toBe("hidden");
  });

  test("the rail stays put after scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/buy");

    const rail = page.locator("aside").first();
    const before = await rail.boundingBox();

    await page.evaluate(() => window.scrollBy(0, 1200));
    await page.waitForTimeout(400);
    const after = await rail.boundingBox();

    if (!before || !after) test.skip();
    // A sticky rail keeps a stable viewport-relative top; a broken one goes
    // negative as it scrolls off the screen.
    expect(
      after!.y,
      `rail scrolled off screen (top moved ${before!.y} -> ${after!.y})`,
    ).toBeGreaterThan(-50);
  });

  test("the page never scrolls sideways", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const path of ["/en", "/en/buy", "/en/dealers"]) {
      await page.goto(path);
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflows, `${path} scrolls horizontally`).toBeFalsy();
    }
  });
});

test.describe("Localisation", () => {
  test("Arabic renders right-to-left", async ({ page }) => {
    await page.goto("/ar");
    const dir = await page.evaluate(
      () => document.documentElement.getAttribute("dir"),
    );
    expect(dir).toBe("rtl");
  });

  test("locale prefix is never doubled", async ({ page }) => {
    await page.goto("/en");
    const hrefs = await page.locator("a[href^='/']").evaluateAll((els) =>
      els.map((e) => e.getAttribute("href") ?? ""),
    );
    const doubled = hrefs.filter((h) => /^\/(en|ar)\/(en|ar)\//.test(h));
    expect(doubled, `doubled locale links: ${doubled.join(", ")}`).toHaveLength(0);
  });
});
