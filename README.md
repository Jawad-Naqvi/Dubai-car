# DXB Motors

Dubai's yard-forward B2B/B2C automotive marketplace platform.

A re-skin of the gocommotion.com/products/ai-os visual language — dark base, bento grid, gradient hero — in a **Dubai gold + deep emerald** palette, applied to a full multi-sided marketplace per the project proposal.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind v4** with `@theme` design tokens
- **Clerk** for auth (organizations enabled for dealer teams; RBAC via `publicMetadata.role`)
- **next-intl** — EN + AR (RTL) from day one
- **Neon Postgres** + **Drizzle ORM** (serverless, edge-friendly)
- **shadcn/ui** primitives + **Framer Motion** + **lucide-react**
- **Cloudflare R2 + Images** for media (zero egress)
- **Meilisearch** (self-host) for faceted search
- **PayTabs** (UAE AED) + **Stripe** (international B2B) for payments
- **Resend** for transactional email
- **Vercel** for hosting

## What's built

### Marketing
- `/` — landing page (hero panel, AI search, bento capabilities, value props, market stats band, voice-AI card, final CTA)
- `/buy` — faceted browse with sidebar
- `/listings/[id]/[slug]` — detail page with gallery, specs, finance calculator, dealer card, export panel, similar cars, JSON-LD `Car` schema
- `/sell` — list-your-car landing + quick-start form
- `/export` — B2B export landing with destinations grid, how-it-works, doc panel, export-ready inventory
- `/valuation` — instant rule-based price estimator
- `/finance` — interactive EMI calculator + bank partner rates
- `/pricing` — Free / Silver / Gold / Platinum dealer plans + add-ons
- `/dealers` + `/dealers/[slug]` — directory + storefront
- `/contact`, `/about`
- `/sign-in`, `/sign-up` — Clerk-hosted

### Dealer dashboard
- `/dashboard` — KPIs, recent leads, plan quota, top performers
- `/dashboard/inventory` — TanStack-shaped listing table with bulk actions
- `/dashboard/leads` — qualified-lead inbox
- `/dashboard/analytics` — views/leads trend chart + segment breakdowns
- `/dashboard/billing` — plan + payment method + invoices

### Admin panel
- `/admin` — alerts strip + KPIs + revenue-by-stream + export destinations
- `/admin/moderation` — listings approval queue
- `/admin/dealers` — verified dealer grid
- `/admin/users` — user role manager
- `/admin/revenue` — MRR trend bars + subscription split + gateway health

### API + infra
- `app/api/webhooks/clerk` — Svix-verified user sync to DB
- `app/api/search` — search proxy (mock-data now, Meilisearch ready)
- `app/api/listings` — CRUD scaffold
- `app/api/leads` — lead unlock scaffold
- `app/sitemap.ts` + `app/robots.ts` — SEO essentials

## Getting started

```bash
# 1. Install deps
npm install
# or: pnpm install

# 2. Fill env
cp .env.example .env.local
# Set CLERK_*, DATABASE_URL, CF_*, MEILI_*, PAYTABS_*, STRIPE_*, RESEND_*

# 3. Push schema
npm run db:push

# 4. Seed mock listings
npm run db:seed

# 5. Run
npm run dev
```

Visit:
- `http://localhost:3000/` — landing (English)
- `http://localhost:3000/ar` — Arabic with RTL
- `http://localhost:3000/buy` — browse
- `http://localhost:3000/listings/L-001/2023-toyota-land-cruiser-vxr-gcc` — detail
- `http://localhost:3000/export` — B2B
- `http://localhost:3000/dashboard` — dealer
- `http://localhost:3000/admin` — admin (requires `publicMetadata.role = "admin"`)

## Design tokens

All colours are CSS variables in `src/app/globals.css` `@theme` block. Swap the palette in one place:

```css
--color-bg-page: #07120E;          /* near-black emerald base */
--color-gold: #D4AF37;             /* primary accent */
--color-gold-bright: #F0CE5C;      /* CTA pill fill */
--color-emerald-700: #0B3B2E;      /* gradient stop */
```

## Brand

Single source of truth in `src/lib/brand.ts` — name, domain, social URLs,
subscription tiers, emirate list, popular makes. Change once, propagates everywhere.

## i18n

- EN messages in `messages/en.json`
- AR messages in `messages/ar.json`
- Locale routing in `src/i18n/routing.ts`
- `dir="rtl"` applied via `app/[locale]/layout.tsx`
- Tajawal font loaded conditionally for AR

## Next steps (Phase 2–4 of the proposal)

- Wire Meilisearch in `src/app/api/search/route.ts` (swap mock filter → meili client)
- Implement `/sell/new` 6-step wizard with R2 signed-URL upload + Trigger.dev pipeline
- Implement PayTabs hosted-checkout for dealer subscriptions + lead unlocks
- Implement B2B verification workflow + admin approval queue
- Add Vehicle JSON-LD validators + Playwright E2E tests
- Wire Cloudflare Images for responsive thumbnails
- Add saved-search alerts (Trigger.dev cron + Resend)

## License

Proprietary — Crystal Group / DXB Motors.
