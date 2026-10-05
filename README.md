# MVP Club app

Phase 1: the customer pages (check-up report and service-call estimate) with sample data.
See `CLAUDE.md` for the business rules and plan.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
```

- `/report/demo` — check-up report (member)
- `/estimate/demo` — service-call estimate (non-member, with "Join MVP Club today")
- `/tech` — tech app (tablet): today's visits, check-up checklist, service-call estimate
- `/r/<token>` — a customer's private report / estimate link

Without Supabase keys the tech app runs on `data/samples/tech-day.json` and saves on the device.

## Database (Supabase)

Housecall Pro stays the system for customers, scheduling, invoices and payments. Supabase holds only
what Housecall Pro can't: tech logins, the visit work (checklist, findings, estimate), photos, customer
links and approvals.

1. Create the tables: Supabase → SQL Editor → paste `supabase/migrations/20260929000000_init.sql` → Run.
2. Keys (Vercel → Settings → Environment Variables, Production + Preview):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Config),
   `SUPABASE_SECRET_KEY` (Secret — server only).
3. Add a tech: Authentication → Users → Add user (email + password, auto-confirm). A `techs` row is
   created automatically; set `name` and `van` in Table Editor → techs.
4. Until the Housecall Pro sync (phase 3), a signed-in tech can press "Load sample visits for today".
5. Office area (`/office`): run `supabase/migrations/20260930000000_office.sql` (safe to re-run), then add
   staff rows: `insert into public.staff (id, role, name) select id, 'admin', 'Nadav' from auth.users where email = '…';`
   Roles: `admin` sees everything; `office` sees approved jobs and scheduling, no revenue or bonus totals.
6. Price list (`/office/prices`, admin): run `supabase/migrations/20261005000000_price_book.sql`. Link a Google
   Sheet (the master list; trades can be given view access) — the app checks it every ~10 minutes and on
   "Sync now", publishes valid changes and logs them; a broken sheet never replaces good prices. Excel/CSV
   upload is the backup. Until a list is published, `data/pricebook.csv` is used.

Local development: `npx supabase start` (Docker), then put the local URL and keys in `.env.local`.

Security: Row Level Security on every table — techs see only their own visits; customer links and
approvals are read only on the server with the secret key; photos are in a private bucket and shown
through short-lived signed links. Prices are recalculated on the server from the price book when the
tech sends, and from that frozen copy when the customer approves.

## Where things live

- `data/pricebook.csv`, `data/inspection_guide.csv` — all prices and findings (read on the server)
- `data/samples/*.json` — the sample check-up and estimate (a database replaces these in phase 2)
- `config/business.ts` — business rules (membership, credits, ratings, trade colors, visit times)
- `config/legal.ts` — legal wording (placeholder until the attorney signs off)
- `lib/pricing.ts` — member / non-member / replacement-credit price rules
- `lib/views.ts` — turns a check-up / estimate into what the customer page shows
- `lib/tech.ts` — tech app rules (checklist areas, send blockers, estimate options)
- `lib/supabase/` — database clients; `proxy.ts` — tech login check
- `app/tech/actions.ts`, `app/r/actions.ts` — server actions (sign in, send, approve)
- `components/` — the page screens
- `docs/mockup/` — the approved mockups
