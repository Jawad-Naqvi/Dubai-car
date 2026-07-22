# Go-Live Checklist — logins, roles & mobile

This is the production hand-off for the multi-sided marketplace: who logs in
where, how roles are assigned, and the state of the mobile apps.

## 1. The four logins (all real)

| Role | How they sign in | What opens | Gate |
| --- | --- | --- | --- |
| **Buyer** (client) | `/sign-in` (Clerk) | Buyer hub: saved cars, price alerts, messages | Clerk session |
| **Dealer / yard / vendor** | `/sign-in`, then `/sell/become-seller` to become a seller | Seller dashboard: inventory, leads, analytics, billing, profile | Clerk session + `role=dealer` |
| **B2B importer** | `/sign-in`, then `/export/register` (admin verifies) | Export desk: inquiries, documents, watchlist | Clerk session + `role=b2b_importer` |
| **Admin** | `/admin-login` (PIN) | Admin panel: moderation, users, dealers, revenue, catalog, banners, audit | `ADMIN_PIN` → signed cookie |

Each login now resolves the **real** signed-in user's role and opens that
role's dashboard (`getDashboardRole()` in `src/lib/data/users.ts`). Roles live
in Clerk `publicMetadata.role` (source of truth) and are mirrored to the DB
`users.role`.

## 2. Flip off "showcase mode" for production

Today the app runs with **`OPEN_DASHBOARDS=true`**, which holds every dashboard
open (no login) so the app can be demoed. **For production, set it to
`false`** (or remove it):

```
OPEN_DASHBOARDS=false
```

With it off: dashboards require a Clerk login, `/admin/*` requires the admin
PIN, and every API `isAdminAllowed()` / role check enforces real roles.

## 3. Assign roles

- **Dealers self-onboard**: a signed-in user visits `/sell/become-seller`,
  submits their yard details → `POST /api/dealer/onboard` creates their dealer
  record and flips their role to `dealer` (DB + Clerk). Their next dashboard
  load is the seller area.
- **B2B importers**: register at `/export/register`; an admin approves them in
  `/admin/dealers` / B2B verifications, which sets `role=b2b_importer`.
- **Admin can change any role** from `/admin/users`.
- **First admin**: set `ADMIN_PIN` and `ADMIN_SESSION_TOKEN` in env; log in at
  `/admin-login`. To also give a Clerk user the `admin` role, set
  `publicMetadata.role = "admin"` in the Clerk dashboard.

## 4. Required env for production

```
# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...        # user → DB sync
# Admin
ADMIN_PIN=<strong-pin>
ADMIN_SESSION_TOKEN=<random-secret>
# Database
DATABASE_URL=postgres://...           # Neon (or any Postgres)
# Mode
OPEN_DASHBOARDS=false
# Email (SMTP) — leads, saved-search alerts, finance pre-approvals
SMTP_HOST=   SMTP_PORT=587   SMTP_USER=   SMTP_PASS=   SMTP_FROM=
LEADS_NOTIFY_EMAIL=                   # ops fallback recipient
# Crons — protects both /api/catalog/sync AND /api/cron/alerts (saved searches)
CRON_SECRET=
# Optional data/imagery providers (see .env.example)
AUTO_DEV_API_KEY=   API_NINJAS_KEY=   NEXT_PUBLIC_IMAGIN_CUSTOMER_KEY=
VIN_HISTORY_API_KEY=                  # optional real vehicle-history provider
```

### Email & alerts (now wired)

- **SMTP delivery** is live in code (nodemailer). Set the `SMTP_*` vars and new
  buyer enquiries, finance pre-approvals, and saved-search digests all send in
  real time; with SMTP unset they log to the server console.
- **Saved-search alerts**: `vercel.json` schedules `/api/cron/alerts` hourly.
  Set `CRON_SECRET`; Vercel Cron sends it automatically. Off Vercel, hit that
  URL from any scheduler with `Authorization: Bearer $CRON_SECRET`.

Also: in `src/app/api/admin-login/route.ts` set the cookie `secure: true` once
you're behind HTTPS.

## 5. Mobile apps — current state (honest)

- **PWA: built and live.** `src/app/manifest.ts` + installable icons make the
  site a Progressive Web App. On Android (Chrome → Install) and iOS (Safari →
  Share → Add to Home Screen) it installs with the DXB icon, standalone window,
  and offline-safe shell. This is usable **today**.
- **Native Android / iOS store apps: scaffolded, not yet compiled.**
  `capacitor.config.ts` + `MOBILE.md` are in place, but the native projects
  have **not** been generated or built into an APK/IPA. That step needs:
  1. `npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios`
  2. `npx cap add android` (needs Android Studio) and `npx cap add ios`
     (**needs a Mac + Xcode** — cannot be produced on Windows)
  3. `npx cap sync` → open in Android Studio / Xcode → build & submit.

So: the web + PWA are production-ready; the **native store binaries are one
setup pass away and require Android Studio (Android) and a Mac with Xcode
(iOS).** See `MOBILE.md` for the exact commands.

## 6. What still needs hardening before scale

- Payments (PayTabs/Stripe) are scaffolded (`/api/payments`) — wire live keys.
- Email is done (SMTP). Optional: add an SMS/WhatsApp provider for lead alerts.
- Rate-limiting on public write endpoints (leads, onboarding, b2b register).
- Replace the admin PIN with Clerk `admin` role + org RBAC if you want per-admin
  audit identity (the audit log already records actions).
