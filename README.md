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

## Where things live

- `data/pricebook.csv`, `data/inspection_guide.csv` — all prices and findings (read on the server)
- `data/samples/*.json` — the sample check-up and estimate (a database replaces these in phase 2)
- `config/business.ts` — business rules (membership, credits, ratings, trade colors, visit times)
- `config/legal.ts` — legal wording (placeholder until the attorney signs off)
- `lib/pricing.ts` — member / non-member / replacement-credit price rules
- `lib/views.ts` — turns a sample into what the customer page shows
- `components/` — the page screens
- `docs/mockup/` — the approved mockups
