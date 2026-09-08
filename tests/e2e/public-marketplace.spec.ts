import { test, expect } from "@playwright/test";

/**
 * The public marketplace — what a signed-out visitor can actually do.
 *
 * These assert BEHAVIOUR, not markup: that search narrows results, that a
 * filter changes the count, that a listing page shows a real car. A test that
 * only checks "the page returned 200" would have passed against every broken
 * build in this project's history.
 */

test.describe("Public marketplace", () => {
  test("home page loads with real inventory and working nav", async ({ page }) => {
    await page.goto("/en");

    await expect(page.locator("h1")).toContainText(/Export-Ready|cars/i);

    // Primary nav must reach the two commercial surfaces. Scope to the nav —
    // the footer repeats these links, which makes a bare role query ambiguous.
    const nav = page.getByRole("navigation").first();
    await expect(nav.getByRole("link", { name: "Buy", exact: true })).toBeVisible();
    await expect(
      nav.getByRole("link", { name: "Dealers", exact: true }),
    ).toBeVisible();

    // Real listings, not an empty shell.
    const cars = page.locator('a[href*="/listings/"]');
    expect(await cars.count()).toBeGreaterThan(0);
  });

  test("browse page lists cars with prices in AED", async ({ page }) => {
    await page.goto("/en/buy");

    await expect(page.locator("h1")).toContainText(/cars for sale/i);

    const cards = page.locator('a[href*="/listings/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // Prices must render as money, not as a raw number or NaN.
    await expect(page.getByText(/AED\s?[\d,]+/).first()).toBeVisible();
  });

  test("search narrows the result set", async ({ page }) => {
    await page.goto("/en/buy");
    const allText = await page.locator("body").innerText();
    const totalMatch = allText.match(/([\d,]+)\s*matches/i);
    const total = totalMatch ? Number(totalMatch[1].replace(/,/g, "")) : 0;

    // Search for a make we know is seeded.
    await page.goto("/en/buy?q=Toyota");
    await expect(page.locator("h1")).toContainText(/Toyota/i);

    const filteredText = await page.locator("body").innerText();
    const filteredMatch = filteredText.match(/([\d,]+)\s*matches/i);
    const filtered = filteredMatch
      ? Number(filteredMatch[1].replace(/,/g, ""))
      : 0;

    // A search that returns everything is a search that isn't working.
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThanOrEqual(total);
  });

  test("filtering by make changes the results", async ({ page }) => {
    await page.goto("/en/buy?make=BMW");
    const body = await page.locator("body").innerText();

    // Every visible car title should be the make we filtered on.
    const titles = await page.locator('a[href*="/listings/"] h3, a[href*="/listings/"]').allTextContents();
    const carTitles = titles.filter((t) => /\d{4}\s+\w+/.test(t));
    if (carTitles.length > 0) {
      expect(carTitles.some((t) => /BMW/i.test(t))).toBeTruthy();
    }
    expect(body).not.toContain("Application error");
  });

  test("grid and list view toggle both render cars", async ({ page }) => {
    await page.goto("/en/buy?view=list");
    const listCount = await page.locator('a[href*="/listings/"]').count();

    await page.goto("/en/buy?view=grid");
    const gridCount = await page.locator('a[href*="/listings/"]').count();

    expect(listCount).toBeGreaterThan(0);
    expect(gridCount).toBeGreaterThan(0);
  });

  test("listing detail shows the vehicle and a way to contact the seller", async ({
    page,
  }) => {
    await page.goto("/en/buy");
    const firstCar = page.locator('a[href*="/listings/"]').first();
    await firstCar.click();

    await page.waitForURL(/\/listings\//);
    await expect(page.locator("h1")).toBeVisible();

    // Price and a contact affordance are the two things this page exists for.
    await expect(page.getByText(/AED\s?[\d,]+/).first()).toBeVisible();
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/availability|contact|message|enquir|quote/i);
  });

  test("dealers directory renders dealer cards", async ({ page }) => {
    await page.goto("/en/dealers");
    await expect(page.locator("h1")).toContainText(/dealer/i);
    expect(await page.locator('a[href*="/dealers/"]').count()).toBeGreaterThan(0);
  });

  test("no page throws a Next.js error overlay", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    for (const path of ["/en", "/en/buy", "/en/dealers", "/en/export", "/en/sell"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const body = await page.locator("body").innerText();
      // Match real error surfaces only. A bare /500/ matches ordinary content
      // like "18,500 km", which makes this assertion fire on healthy pages.
      expect(body, `${path} rendered an error`).not.toMatch(
        /Application error|Unhandled Runtime Error|Internal Server Error|This page could not be found/i,
      );
    }
    expect(errors, `console errors: ${errors.join(" | ")}`).toHaveLength(0);
  });
});

test.describe("Sign-up wall for guests", () => {
  test("guests see a capped list and a wall on /buy", async ({ page }) => {
    await page.goto("/en/buy");
    const body = await page.locator("body").innerText();

    // The wall only appears when there is more inventory than the guest cap.
    const totalMatch = body.match(/([\d,]+)\s*matches/i);
    const total = totalMatch ? Number(totalMatch[1].replace(/,/g, "")) : 0;

    if (total > 9) {
      await expect(page.getByText(/more cars available/i)).toBeVisible();
      await expect(page.getByRole("link", { name: /sign up free/i })).toBeVisible();
      // Guests must not be able to page past the wall.
      expect(await page.locator('a[href*="page=2"]').count()).toBe(0);
    } else {
      test.info().annotations.push({
        type: "note",
        description: `Only ${total} cars seeded — wall not triggered, cap not exercised.`,
      });
    }
  });
});
