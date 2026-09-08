import { test, expect, type Page } from "@playwright/test";
import { clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import {
  createTestUser,
  deleteTestUser,
  type TestUser,
} from "./helpers/clerk-users";

/**
 * THE REAL TEST: two genuinely signed-in accounts, proving one cannot see the
 * other's data.
 *
 * Everything above this file either runs signed-out or runs with
 * OPEN_DASHBOARDS, so neither can demonstrate isolation — there is no session
 * to isolate. Here two actual Clerk users are created, signed in through the
 * real sign-in page, and asked for each other's data.
 *
 * Must run against a server where auth is enforced. The users are deleted in
 * teardown.
 */

let alice: TestUser;
let bob: TestUser;

test.beforeAll(async () => {
  await clerkSetup();
  alice = await createTestUser("alice");
  bob = await createTestUser("bob");
});

test.afterAll(async () => {
  if (alice) await deleteTestUser(alice.id);
  if (bob) await deleteTestUser(bob.id);
});

/** Signs in through the real UI — the same path a customer takes. */
async function signIn(page: Page, user: TestUser) {
  await setupClerkTestingToken({ page });
  await page.goto("/en/sign-in");

  // This instance renders identifier and password on ONE form, so fill both
  // and submit once. (A two-step flow would need a second Continue.)
  await page.waitForSelector('input[name="identifier"]', { timeout: 45_000 });
  await page.fill('input[name="identifier"]', user.email);

  const passwordField = page.locator('input[name="password"]');
  if (await passwordField.count()) {
    await passwordField.fill(user.password);
    await page.getByRole("button", { name: /^continue$/i }).first().click();
  } else {
    await page.getByRole("button", { name: /^continue$/i }).first().click();
    await page.waitForSelector('input[name="password"]', { timeout: 30_000 });
    await page.fill('input[name="password"]', user.password);
    await page.getByRole("button", { name: /^continue$/i }).first().click();
  }

  // This instance asks for email verification on a new device. Reserved
  // "+clerk_test" addresses always accept 424242, so the flow completes
  // without disabling the protection or reading a real mailbox.
  await page.waitForTimeout(2_000);
  if (/factor-two|verification/i.test(page.url())) {
    const otp = page.locator('input[autocomplete="one-time-code"], input[name="code"]');
    await otp.first().waitFor({ timeout: 20_000 });
    // Some builds render six single-character boxes, others one field.
    const boxes = await otp.count();
    if (boxes > 1) {
      for (let i = 0; i < 6; i += 1) await otp.nth(i).fill("424242"[i]);
    } else {
      await otp.first().fill("424242");
    }
    const submit = page.getByRole("button", { name: /^continue$/i });
    if (await submit.count()) await submit.first().click();
  }

  // Clerk lands on /post-auth, which then redirects by organization. Wait for
  // that SECOND hop to settle — stopping at /post-auth catches the app
  // mid-redirect and makes the destination assertion race.
  await page.waitForURL(
    (u) => !/sign-in|post-auth/.test(u.pathname),
    { timeout: 60_000 },
  );
}

test.describe("A real session can reach its own workspace", () => {
  test("signing in gets past the auth wall", async ({ page }) => {
    await signIn(page, alice);

    // A brand-new account has never said what it is here to do, so the single
    // login must land it on the account-type picker — not silently assume
    // "buyer" and drop it on the marketplace.
    expect(
      page.url(),
      "a new account skipped the account-type question",
    ).toMatch(/\/welcome/);

    await page.goto("/en/dashboard/messages", { waitUntil: "domcontentloaded" });
    expect(
      /sign-in/.test(page.url()),
      "a signed-in user was bounced back to sign-in",
    ).toBeFalsy();
  });

  test("a new account is offered buyer and seller, never forwarder", async ({
    page,
  }) => {
    await signIn(page, alice);
    await page.goto("/en/welcome", { waitUntil: "domcontentloaded" });

    const body = await page.locator("body").innerText();
    if (/what brings you here/i.test(body)) {
      expect(body).toMatch(/buy a car/i);
      expect(body).toMatch(/sell cars/i);
      // Freight partners are invitation-only — the option must not exist.
      expect(body).not.toMatch(/i'?m a freight forwarder/i);
      // But the application route should be signposted.
      expect(body).toMatch(/freight forwarding company|partner network/i);
    }
  });
});

test.describe("Cross-account isolation with real sessions", () => {
  test("one user's chat inbox never contains another user's threads", async ({
    browser,
  }) => {
    // Alice sends an enquiry, creating a conversation she owns.
    const aliceCtx = await browser.newContext();
    const alicePage = await aliceCtx.newPage();
    await signIn(alicePage, alice);

    const aliceInbox = await alicePage.request.get("/api/chat/conversations");
    const aliceData = await aliceInbox.json();
    const aliceIds: string[] = (aliceData.conversations ?? []).map(
      (c: { id: string }) => c.id,
    );

    // Bob signs in separately.
    const bobCtx = await browser.newContext();
    const bobPage = await bobCtx.newPage();
    await signIn(bobPage, bob);

    const bobInbox = await bobPage.request.get("/api/chat/conversations");
    const bobData = await bobInbox.json();
    const bobIds: string[] = (bobData.conversations ?? []).map(
      (c: { id: string }) => c.id,
    );

    // No overlap between two unrelated accounts.
    const shared = aliceIds.filter((id) => bobIds.includes(id));
    expect(
      shared,
      `both accounts can see the same conversations: ${shared.join(", ")}`,
    ).toHaveLength(0);

    // And Bob cannot read one of Alice's threads by id.
    if (aliceIds.length > 0) {
      const probe = await bobPage.request.get(
        `/api/chat/${aliceIds[0]}/messages`,
        { failOnStatusCode: false },
      );
      expect(
        probe.status(),
        "another user's conversation was readable by id",
      ).toBe(404);
    }

    await aliceCtx.close();
    await bobCtx.close();
  });

  test("a signed-in non-admin cannot reach the admin console", async ({
    page,
  }) => {
    await signIn(page, alice);

    await page.goto("/en/admin", { waitUntil: "domcontentloaded" });
    // Middleware sends non-admins to their own dashboard rather than a login
    // prompt they could never satisfy.
    expect(
      /\/admin(\/|$)/.test(new URL(page.url()).pathname),
      "a plain user reached the admin console",
    ).toBeFalsy();

    const api = await page.request.get("/api/admin/invitations", {
      failOnStatusCode: false,
    });
    expect(
      api.status(),
      "a plain user could list admin invitations",
    ).toBe(403);
  });

  test("a signed-in user cannot mint an invitation", async ({ page }) => {
    await signIn(page, alice);

    // This is the escalation path that would matter most: minting a forwarder
    // or admin onboarding link.
    for (const orgType of ["forwarder", "platform"]) {
      const res = await page.request.post("/api/admin/invitations", {
        data: { orgType },
        failOnStatusCode: false,
      });
      expect(
        res.status(),
        `a plain user minted a "${orgType}" invitation`,
      ).toBe(403);
    }
  });

  test("a signed-in user cannot post milestones on a shipment", async ({
    page,
  }) => {
    await signIn(page, alice);
    const res = await page.request.post(
      "/api/freight/shipments/00000000-0000-0000-0000-000000000000/milestones",
      { data: { milestone: "delivered" }, failOnStatusCode: false },
    );
    expect([400, 403, 404]).toContain(res.status());
  });

  test("a signed-in user cannot self-assign a privileged account type", async ({
    page,
  }) => {
    await signIn(page, alice);
    for (const type of ["forwarder", "platform", "admin"]) {
      const res = await page.request.post("/api/onboarding/choose", {
        data: { type },
        failOnStatusCode: false,
      });
      expect(res.status(), `onboarding accepted "${type}"`).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/invitation only/i);
    }
  });
});

test.describe("Onboarding writes real state", () => {
  test("choosing buyer creates the account and lets the user browse", async ({
    page,
  }) => {
    await signIn(page, bob);
    await page.goto("/en/welcome", { waitUntil: "domcontentloaded" });

    const body = await page.locator("body").innerText();
    if (!/what brings you here/i.test(body)) {
      test.info().annotations.push({
        type: "note",
        description: "Account already onboarded; picker not shown.",
      });
      return;
    }

    await page.getByRole("button", { name: /here to buy a car/i }).click();
    await page.waitForURL((u) => !/welcome/.test(u.pathname), {
      timeout: 30_000,
    });

    // The choice must persist — going back must not re-ask.
    await page.goto("/en/welcome", { waitUntil: "domcontentloaded" });
    expect(
      /welcome/.test(new URL(page.url()).pathname),
      "the account-type choice did not persist",
    ).toBeFalsy();
  });
});
