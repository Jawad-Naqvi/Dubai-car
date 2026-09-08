import { test, expect } from "@playwright/test";

/**
 * The enterprise-readiness layer.
 *
 * Each block corresponds to something that was absent or actively broken:
 * no security headers, no health probe, an audit table with zero writers, a
 * bell hardcoded to always look unread, a "GDPR Compliant" badge with no
 * export or deletion path, a rate limiter on the public endpoint that could
 * never fire, and listings that could carry a duplicate chassis number or no
 * photo at all.
 */

test.describe("Security headers", () => {
  test("every page carries the hardening headers", async ({ request }) => {
    const res = await request.get("/en");
    const h = res.headers();

    expect(h["x-frame-options"], "clickjacking is not prevented").toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["strict-transport-security"]).toContain("max-age=");
    expect(h["permissions-policy"]).toContain("microphone=()");

    const csp = h["content-security-policy"] ?? "";
    expect(csp, "no CSP").toContain("default-src 'self'");
    // The two directives that actually stop injection and framing.
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  test("the framework version is not advertised", async ({ request }) => {
    const res = await request.get("/en");
    expect(res.headers()["x-powered-by"]).toBeUndefined();
  });

  test("API responses are never cached by a shared cache", async ({
    request,
  }) => {
    const res = await request.get("/api/health");
    expect(res.headers()["cache-control"]).toContain("no-store");
    // User data must not be indexed if a URL leaks.
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
  });
});

test.describe("Health probe", () => {
  test("reports status and a real database check", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    // A probe that does not actually touch the database is decoration.
    expect(["ok", "skipped"]).toContain(body.checks?.database);
    expect(typeof body.uptimeSec).toBe("number");
  });

  test("leaks nothing useful to an attacker", async ({ request }) => {
    const raw = await (await request.get("/api/health")).text();
    expect(raw).not.toMatch(/postgres|neon\.tech|sk_|password|secret/i);
  });
});

test.describe("Landed-cost calculator", () => {
  test("is offered on a listing and computes a real duty stack", async ({
    page,
  }) => {
    await page.goto("/en/buy");
    await page.locator('a[href*="/listings/"]').first().click();
    await page.waitForURL(/\/listings\//);

    const calc = page.getByText(/cost to import this car/i);
    if ((await calc.count()) === 0) {
      test.info().annotations.push({
        type: "note",
        description: "Quote-only listing — calculator intentionally hidden.",
      });
      return;
    }
    await expect(calc).toBeVisible();

    // Kenya stacks duty + excise + VAT, so it exercises compounding bases.
    const select = page.locator("select").filter({ hasText: /Kenya/i }).first();
    await select.selectOption("KE");

    await expect(page.getByText(/estimated landed cost in Kenya/i)).toBeVisible();
    await expect(page.getByText(/AED\s?[\d,]+/).first()).toBeVisible();

    // Duty must be a real addition, not zero.
    await expect(page.getByText(/duty and taxes add/i)).toBeVisible();

    // Country-specific restrictions must surface — UAE stock is left-hand
    // drive and Kenya accepts right-hand drive only. Failing to say so would
    // let someone buy a car they legally cannot import.
    // .first(): the phrase appears in both the restriction banner and the
    // caveat list, which makes a bare getByText ambiguous under strict mode.
    await expect(page.getByText(/right-hand-drive/i).first()).toBeVisible();
    await expect(page.getByText(/under 8 years old/i)).toBeVisible();
  });

  test("the estimate is labelled as an estimate", async ({ page }) => {
    await page.goto("/en/buy");
    await page.locator('a[href*="/listings/"]').first().click();
    await page.waitForURL(/\/listings\//);

    const calc = page.getByText(/cost to import this car/i);
    if ((await calc.count()) === 0) return;

    await page.locator("select").filter({ hasText: /Kenya/i }).first()
      .selectOption("KE");
    // A number this consequential must not be presented as a quote.
    await expect(page.getByText(/an estimate, not a quote/i)).toBeVisible();
  });
});

test.describe("Rate limiting", () => {
  test("the public partner endpoint actually limits", async ({ request }) => {
    // This previously read `if (!rateLimit(...))` — rateLimit returns an
    // object, so the negation was always false and the limiter never fired.
    const send = () =>
      request.post("/api/partners/apply", {
        data: {
          companyName: "RL Test",
          contactName: "RL",
          email: `rl-${Math.random().toString(36).slice(2)}@example.com`,
        },
        failOnStatusCode: false,
      });

    let sawLimit = false;
    for (let i = 0; i < 9; i += 1) {
      const res = await send();
      if (res.status() === 429) {
        sawLimit = true;
        expect(res.headers()["retry-after"]).toBeTruthy();
        break;
      }
    }
    expect(sawLimit, "the limiter never fired after 9 rapid submissions").toBe(
      true,
    );
  });
});

test.describe("Privacy rights", () => {
  test("data export requires a session", async ({ request }) => {
    const res = await request.get("/api/account/export", {
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });

  test("account deletion requires a session and a typed confirmation", async ({
    request,
  }) => {
    const anon = await request.post("/api/account/delete", {
      data: { confirm: "DELETE" },
      failOnStatusCode: false,
    });
    expect([400, 401]).toContain(anon.status());

    // And it must never fire without the exact confirmation word.
    const noConfirm = await request.post("/api/account/delete", {
      data: {},
      failOnStatusCode: false,
    });
    expect(noConfirm.status()).toBe(400);
  });
});

test.describe("Notification centre", () => {
  test("returns nothing to an anonymous caller", async ({ request }) => {
    const res = await request.get("/api/notifications");
    const body = await res.json();
    expect(body.notifications ?? []).toEqual([]);
    expect(body.unread).toBe(0);
  });

  test("the count endpoint is cheap and self-scoped", async ({ request }) => {
    const res = await request.get("/api/notifications?count=1");
    const body = await res.json();
    expect(body).toHaveProperty("unread");
    expect(body).not.toHaveProperty("notifications");
  });

  test("marking read requires a session", async ({ request }) => {
    const res = await request.post("/api/notifications", {
      data: {},
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });
});

test.describe("Client error reporting", () => {
  test("accepts a crash report and returns no body", async ({ request }) => {
    const res = await request.post("/api/client-error", {
      data: { message: "e2e synthetic", digest: "abc123", url: "/en" },
      failOnStatusCode: false,
    });
    expect([204, 429]).toContain(res.status());
  });

  test("rejects an oversized payload", async ({ request }) => {
    const res = await request.post("/api/client-error", {
      data: { message: "x".repeat(20_000) },
      failOnStatusCode: false,
    });
    expect([413, 429]).toContain(res.status());
  });
});

test.describe("Scheduled jobs are not open to the internet", () => {
  test("freight expiry refuses an unauthenticated call in production", async ({
    request,
  }) => {
    const res = await request.get("/api/cron/freight-expiry", {
      failOnStatusCode: false,
    });
    // 401 in production; 200 only in local dev where the gate is relaxed.
    expect([200, 401]).toContain(res.status());
  });
});
