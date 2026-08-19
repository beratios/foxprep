# FoxPrep — Amazon & eBay Prep Center Platform

Next.js 14 (App Router, TypeScript, Tailwind) + Prisma. Real inbound/inventory/
outbound shipment tracking (not just a bare "order"), customer wallet, admin
+ warehouse-staff panels, WhatsApp support button everywhere. Stripe and
Amazon SP-API are wired in as clearly marked stubs — the app runs and is
fully testable without either.

## How stock actually flows through the system — and where money moves

This matters because it's the core of how the app is structured. **Billing
happens at step 2 (right after receiving), not at step 4 (shipping out).**

1. **Inbound** — customer tells us stock is coming (product + expected
   quantity, with a photo for new products). We give them the warehouse
   address to pass to their supplier.
2. **Receiving** — warehouse staff count what actually arrived and enter it.
   If it doesn't match what was expected, the shipment is flagged
   `DISCREPANCY`. Either way, the customer (or staff on their behalf) then
   picks prep add-ons (poly-bagging, bundling, custom insert — labeling is
   mandatory and already baked into the per-unit rate) and **pays before any
   physical prep work starts**. This is the only place money changes hands
   for prep — see `/api/inbound/[id]/pay`.
3. **Inventory** — paid, prepped stock sits here, tracked per SKU per
   customer, until it's shipped out or removed.
4. **Outbound** — moves already-paid-for stock to Amazon FBA or direct to a
   customer (FBM). **Not billed** — the customer already paid for this stock
   when it was received. This step is just "pick product(s) + quantity,
   choose channel, send it," plus later adding tracking info.
5. **Removals** — customer can request stock pulled back out instead of
   shipped onward (mirrors Amazon's FBA removal orders).

Why pay-at-receiving instead of pay-at-shipping: charging before any labor
happens means you never do prep work for free while chasing payment
afterward. Charging at inbound (once the real received quantity is known,
not just what the customer estimated when creating the inbound shipment) is
also more accurate than charging at inbound-creation time, before anyone has
actually counted the stock.

## Pricing — three things that are easy to get wrong

- **Billing happens at inbound-receiving, not at outbound-shipping.** See
  `lib/pricing.ts` → `quotePrepWork()`, called from `/api/inbound/[id]/pay`.
  Outbound shipment creation (`/api/outbound`, `/api/admin/outbound`) never
  charges anything — it only moves inventory.
- **Tier is rolling, not per-shipment.** Silver/Platinum/Diamond is decided
  by the customer's total units *received and paid for* in the trailing 30
  days, INCLUDING the inbound shipment being priced — not by how big a
  single shipment is. A customer receiving 5×100 units across a month is a
  500-unit account, correctly priced at whatever tier 500 falls into — not
  five separate 100-unit Silver shipments.
- **This is one-time, not monthly.** The only recurring charge is storage
  past the free 5-day window, and it's never automatic — an admin explicitly
  runs it from `/admin/billing`.
- **Tax is HST (13%)**, because the warehouse is in Ontario — not Quebec's
  GST+QST split. If you ever add a second warehouse in another province,
  `hstRate` in `PricingSetting` will need to become province-aware.
- Each inbound shipment snapshots its own `tier` and `rateApplied` at
  payment time, so changing rates in `/admin/pricing` never retroactively
  alters past invoices.

## Roles

- **CUSTOMER** — everything under `/dashboard`.
- **STAFF** — everything under `/admin` EXCEPT pricing config and customer
  wallet adjustments (those redirect/403 for STAFF). Meant for warehouse
  staff who receive inbound shipments and update outbound tracking, without
  seeing financials.
- **ADMIN** — everything.

Seeded accounts (change these passwords immediately):
- `admin@foxprep.ca` / `changeme123` (ADMIN)
- `warehouse@foxprep.ca` / `changeme123` (STAFF)

## What's real vs. what's a stub

**Real and working today:**
- Register / login / forgot-password / reset-password / email verification
  (JWT session cookie, bcrypt hashing)
- Customer dashboard: send stock in (with new-product photo capture), pay
  the prep fee once it's received (live quote using real rolling-volume
  tier), view inventory, create free outbound shipments to Amazon/FBM,
  request removals, wallet + top-up, support tickets
- Admin/staff panel: receive inbound shipments (enter actual counts,
  auto-flags discrepancies), charge the prep fee on a customer's behalf,
  create/manage outbound shipments and tracking (cancelling restocks
  inventory), view all inventory with source-shipment traceability, process
  removal requests,
  reply to tickets, run monthly storage billing
- Admin-only: edit pricing, view/adjust customer wallet balances
- Email notifications fire at every state change (inbound received, low
  stock, shipment status, ticket replies, password reset, verification) —
  see `lib/email.ts`. They log to the console until `RESEND_API_KEY` is set.
- WhatsApp button (`lib/config.ts` → `WHATSAPP_NUMBER`) on every customer page

**Stubbed — needs real credentials before going live:**
- `lib/stripe.ts` — wallet top-up via Stripe Checkout. Throws a clear error
  until `STRIPE_SECRET_KEY` is set. Use the "Demo top-up" button on the
  wallet page to test the shipment flow without Stripe.
- `lib/amazon.ts` — Amazon SP-API connection. `/api/amazon/connect`
  currently marks the account "connected" immediately for demo purposes
  instead of doing a real LWA OAuth redirect. Real inventory sync is not
  implemented — see TODOs in that file.
- `lib/email.ts` — logs to console until `RESEND_API_KEY` is set.

**Known gaps worth knowing about before relying on this in production:**
- Product photo upload (in the "send stock in" flow) only creates a local
  browser preview (`URL.createObjectURL`) — it is NOT uploaded anywhere
  persistent yet. Wire it to Vercel Blob, S3, or Cloudinary before you need
  photos to survive a page refresh or be visible to warehouse staff.
- The wallet-balance check before creating an outbound shipment has a
  narrow race-condition window (rapid double-submit could theoretically
  pass the check twice). Low risk at current scale; revisit with row
  locking if it ever matters.
- Storage billing treats 1 unit = 1 box for simplicity. If you start
  tracking boxes distinctly from units, update `calculateStorageFee()`
  in `lib/pricing.ts`.

## Local setup

```bash
npm install
```

You need a Postgres database. Fastest options: [Neon](https://neon.tech)
(free tier) or Vercel Postgres. Copy `.env.example` to `.env` and fill in
`DATABASE_URL` and `SESSION_SECRET` (generate with `openssl rand -base64 32`).

```bash
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Visit `http://localhost:3000`. Register a customer account, or log in as
admin/staff with the seeded credentials above.

## Deploying on Vercel

1. Push this repo to GitHub, import it into Vercel.
2. Add a Postgres database (Vercel Postgres, or connect a Neon/Supabase URL)
   and set `DATABASE_URL` in Vercel's environment variables.
3. Set `SESSION_SECRET` in Vercel's environment variables.
4. Vercel runs `prisma generate` automatically via the `postinstall` script.
   After the first deploy, run `npx prisma migrate deploy` against the
   production database.
5. Run the seed script once against production the same way (or create the
   first admin manually via `npx prisma studio`), then change its password.

SQLite is intentionally **not** used here even for a quick start, because
Vercel's serverless functions don't have a persistent filesystem.

## Turning on Stripe

1. Create a Stripe account, grab keys from the dashboard.
2. Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Add a webhook endpoint pointing at `https://yourdomain.com/api/stripe/webhook`,
   listening for `checkout.session.completed`, and set `STRIPE_WEBHOOK_SECRET`.
4. Test with Stripe's test card `4242 4242 4242 4242`.
5. The "Demo top-up" button auto-disables the moment `STRIPE_SECRET_KEY` is set (works on Vercel too, until then).

## Turning on Amazon SP-API

See the TODO comments at the top of `lib/amazon.ts`.

## Turning on real emails

1. Create a Resend account, verify your sending domain.
2. Set `RESEND_API_KEY` and `EMAIL_FROM` in `.env`.
3. That's it — every notification call site already exists; this is the
   only change needed.

## Editing brand details

Company name, WhatsApp number, and warehouse address all live in one place:
`lib/config.ts`.

## Multi-language marketing site

The public marketing/pricing landing page with 6-language support (EN/TR/ES/
FR/ZH/AR) was prototyped separately as a standalone React artifact
(`prepkingz-landing.jsx`, delivered earlier in this conversation). Port its
JSX into `app/page.tsx` when ready. The dashboard and admin panel are
English-only for now — extending them to other languages follows the same
pattern as that landing page but was scoped out of this pass to focus on
the functional system.
