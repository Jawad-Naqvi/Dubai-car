# DXB Motors — Setup Guide

> **Status: ✅ Connected to a live Neon PostgreSQL database.** All data now
> persists in Postgres. The app uses the standard `pg` driver, so it is
> **database-agnostic** — moving to AWS RDS/Aurora later means changing **only**
> `DATABASE_URL` in `.env`, nothing in code.

## Migrating to AWS RDS / Aurora (production)

When you launch, point the app at AWS by editing one line:

```bash
DATABASE_URL=postgresql://<user>:<pass>@<your-db>.xxxx.<region>.rds.amazonaws.com:5432/dxbmotors?sslmode=require
```

Then `npm run db:push` (or `db:generate` + apply) to create the schema on RDS,
and `npm run db:seed` if you want sample data. No application code changes — the
`pg` driver and Drizzle schema work identically on Neon, RDS, and Aurora.

> ⚠️ Before production, set `OPEN_DASHBOARDS=false` in `.env` (see below) and
> **rotate the `CLERK_SECRET_KEY`** that was shared in plaintext.

---

The app also runs in **Demo Mode** automatically if `DATABASE_URL` is removed —
everything works in-memory with no external accounts, useful for quick local
trials.

---

## Demo Mode (current — zero setup)

`npm run dev` → open http://localhost:3000

Without a real `DATABASE_URL`, the app uses an in-memory store so every flow is
fully functional and persists for the life of the dev server:

- **Buy** — real search, multi-filter, sort, pagination, saved cars, compare (up to 3)
- **Listing detail** — gallery, live finance calculator, lead/contact/export forms
- **Sell** — 4-step wizard with photo upload → listing goes to "pending review"
- **Valuation** — instant estimate blended with live market comparables
- **Dealer dashboard** — KPIs, inventory CRUD (mark sold/reserved/feature/delete),
  lead inbox with status, billing + plan switching
- **Admin** (open in demo) — approve/reject listings, manage user roles, verify
  dealers + B2B buyers, revenue dashboards
- **B2B export** — register as importer → appears in admin verification queue

> Demo data resets when the dev server restarts. Admin pages are open in demo
> mode; in Cloud Mode they require the `admin` role.

**Try the full loop:** Sell a car at `/sell/new` → approve it in
`/admin/moderation` → find it live in `/buy`.

---

## Cloud Mode (production-grade)

### 1. Database (required) — Neon Postgres (free)

1. Create a free project at https://neon.tech
2. Copy the connection string (looks like
   `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`)
3. Put it in `.env.local` as `DATABASE_URL=...`
4. Push the schema and seed sample data:

```bash
npm run db:push     # creates all tables from src/lib/db/schema.ts
npm run db:seed     # loads the 6 sample dealers + 12 listings
```

That's it — the app now reads/writes Postgres automatically. The same data layer
powers both modes, so no code changes are needed.

### 2. Auth roles (required for dealer/admin areas in Cloud Mode)

Auth already works via Clerk. To grant a user the dealer or admin area:

1. Sign up in the app (`/sign-up`)
2. In the Clerk dashboard → Users → your user → **Public metadata**, add:
   ```json
   { "role": "admin" }
   ```
   (or `"dealer"` / `"b2b_importer"`). Buyers need no role.

> **For testing right now**, `.env` has `OPEN_DASHBOARDS=true`, which opens the
> dealer dashboard + admin panel without sign-in so you can click through
> everything against the live DB. The dashboard falls back to a seeded dealer's
> data. **Set it to `false` for production** to enforce Clerk roles.

> ⚠️ The `CLERK_SECRET_KEY` currently in `.env.local` is a placeholder/test key
> that was shared in plain text — **rotate it in the Clerk dashboard** before any
> real use, and never commit `.env.local`.

### 3. Optional integrations (graceful fallbacks until added)

| Feature | Env vars | Without it |
|---|---|---|
| Photo storage (Cloudflare R2) | `CF_R2_ACCOUNT_ID`, `CF_R2_ACCESS_KEY_ID`, `CF_R2_SECRET_ACCESS_KEY`, `CF_R2_BUCKET` | Uploads map to stock photos (also run `npm i @aws-sdk/client-s3`) |
| Payments (PayTabs/Stripe) | `PAYTABS_PROFILE_ID` or `STRIPE_SECRET_KEY` | Plan changes simulate an instant successful charge |
| Email (Resend) | `RESEND_API_KEY` | Lead notifications log to the server console |

---

## Commands

```bash
npm run dev        # start dev server
npm run build      # production build
npm run typecheck  # TypeScript check
npm run db:push    # push schema to DB (Cloud Mode)
npm run db:seed    # seed sample data (Cloud Mode)
npm run db:studio  # browse the DB in Drizzle Studio
```
