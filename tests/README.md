# End-to-end tests

Two suites, deliberately separated because they need different servers. Running
one against the other's server produces failures that look like app bugs but
are really setup mistakes.

## 1. Main suite — `npm run test:e2e`

Runs against a **production** server, where authorization is genuinely
enforced (`OPEN_DASHBOARDS` is hard-disabled in production builds).

```bash
npm run build
npm run start          # http://localhost:3000
npm run test:e2e
```

Covers:

| Spec | What it proves |
|---|---|
| `public-marketplace.spec.ts` | Browsing, search actually narrows results, filters, grid/list, listing detail, dealer directory, guest sign-up wall |
| `security-isolation.spec.ts` | Every protected route requires auth; the old PIN login is gone; forging the old `dxb_admin` cookie grants nothing; anonymous API calls return **empty**, not filtered data; private media is not served; invalid invite tokens are refused generically |
| `freight-onboarding.spec.ts` | Partner application accepts a submission and grants **no** access; sign-up never offers "forwarder"; sticky-sidebar regression; no horizontal scroll; Arabic RTL; no doubled locale prefixes |
| `real-session.spec.ts` | **Two real Clerk users**, signed in through the real UI, cannot see each other's conversations; a plain user cannot reach the admin console, mint an invitation, post shipment milestones, or self-assign a privileged account type |

`real-session.spec.ts` creates real Clerk users and deletes them in teardown.
It uses Clerk's reserved `+clerk_test` addresses, which accept the fixed code
`424242` — this instance requires new-device email verification, and that is
the supported way through it rather than turning the protection off.

## 2. Render suite — `npm run test:e2e:auth`

Reaches the signed-in workspaces **without** a session, purely to prove they
build, hydrate and show correct empty/pending states. It cannot test isolation,
because there is no session to isolate.

```bash
OPEN_DASHBOARDS=true npx next dev -p 3100
npm run test:e2e:auth
```

> **Do not run a dev server and a production server from the same checkout at
> the same time.** They share `.next`, and the dev server overwrites the
> production build's static chunks. The production app then serves HTML
> referencing chunks that no longer exist and every page silently fails to
> hydrate — which looks exactly like "Clerk is broken".

The first run may time out on a cold route compile; it passes warm.

## 3. Database-level test

Some guarantees can't be reached through a browser without elaborate fixtures —
consolidation, event-log projection, per-org financial secrecy. Those are
asserted directly against the database inside a transaction that is rolled
back, so nothing persists. See the freight end-to-end script referenced in the
commit history.

## What is NOT covered

Stated plainly so nobody assumes more coverage than exists:

- A full freight lifecycle driven through the browser (RFQ → bid → award →
  milestone) needs a verified forwarder org, which only an admin invitation can
  create. The logic is covered by the database test instead.
- Payments. Stripe is in test mode and no checkout is exercised.
- Email and WhatsApp delivery are fire-and-forget and are not asserted.
