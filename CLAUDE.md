# MVP Club app — project brief for Claude Code

Read this file first in every session. It is the source of truth for what we are building and the business rules.
The owner, Nadav, is not a developer: explain in plain words, show him what changed, and give him a link to test on his phone after every step.

## The business

MVP Home Services LLC, brand **MVP Club**, Cincinnati. A home-service membership company run with an electrical, an HVAC and a plumbing partner.
Members pay **$30/month or $330/year** (12-month first term, then month to month). Membership covers one heating/cooling system; each extra system is +$10/month.
Members get two check-ups a year (spring = AC focus, fall = furnace focus); every check-up covers all three trades (HVAC, plumbing, electrical including panel with cover off, meter base, service cable).

## What we are building

1. **Tech app** (phone, used on site): today's visits, home profile (equipment + ages + label photos), three-trade checklist, recommendations picked from the price book, send the report or estimate.
2. **Customer page** (one link by text, no login): the check-up report or the service-call estimate, where the customer adds items like an Amazon cart, picks a day, signs with a finger and approves. **This page is the most important screen in the whole system.**
3. **Office dashboard**: open recommendations, reminders due, weekly tech bonus, partner scorecard.

Housecall Pro (MAX plan) stays the system for scheduling, dispatch, invoices, payments, membership billing, texts and review requests. Our app creates jobs in Housecall Pro through its API (phase 3). **We never store card numbers.**

## Design reference

`docs/mockup/checkup-report.dc.html` and `docs/mockup/service-call-estimate.dc.html` are the approved clickable mockups (Nadav: "it looks amazing"). Match their layout, wording, flow and colors. They are written in a mockup format, not React: read them for the design, the copy and the logic in the `<script>` block, then rebuild in our stack.

Brand:
- Navy `#14223D` (header, text), page background `#F4F5F7`, cards white.
- Trade stripe colors: electrical `#F2B705`, plumbing `#2F8FE0`, heating & cooling `#F2672A`.
- Primary button (approve) `#B8410F` with white text; success green `#1E7B45`.
- Logo: three stripes skewed -14deg (yellow, blue, orange) + "MVP" in Google font **Graduate**. Headings **Barlow Condensed** 700, body **Barlow**.
- Touch targets at least 44px. Phone-first (390px wide), must also look fine on a tablet.

## Business rules (do not change without Nadav)

- **Member discount:** member prices come from the price book `member_price` column (15% off service work; replacements get a credit instead).
- **Service call:** members $19, non-members $119. The $119 is **never** credited toward the repair. The only way to pay $19 is to join the club on that visit.
- **Join and save (non-member estimate):** one switch, "Join MVP Club today — $30/month", flips every option to member prices and the service call to $19, and shows the savings for this visit. Joining happens on the same approve screen (signature; card handled by Housecall Pro).
- **Replacement credits** (members, only after 90 days of membership): Small $100, Medium $250, Large $500, by `credit_tier` in the price book.
- **Urgency ratings** (from the Inspection Guide):
  - RED = fix now: offered on site; urgent items come pre-added in the cart.
  - ORANGE = within 6 months: reminders at 3 and 5 months.
  - YELLOW = within 12 months: reminder before the next check-up.
  - GREEN = monitor: re-check next visit.
- Every recommendation must match a row in `data/inspection_guide.csv`; techs pick items from `data/pricebook.csv` and **cannot type or change prices**.
- A RED item cannot be sent without a photo. A check-up cannot be closed until all three trades are done.
- **Legal (placeholder until the attorney signs off):** work approved in the home gets Ohio's 3-business-day right to cancel. The approve screen shows the notice and the signed copy is emailed. Emergency same-visit repairs use waiver wording. Keep these texts in one config file so the attorney's wording drops in.
- **Tech bonus (per van, per week):** 5% of revenue from $6,700 to $7,500, +$100 at $7,500 or more, 10% of every dollar above $7,500, +$25 for every report item sold (credited to the tech who found it). Revenue = paid jobs before sales tax; membership fees don't count.
- **Partner scorecard (quarterly):** callbacks, Google reviews, on-time check-ups, report items sold (weights still to be agreed).

## Data files

- `data/pricebook.csv` — 62 tasks across the three trades: code, trade, category, task, hours, standard and member price, rate type, credit tier, notes.
- `data/inspection_guide.csv` — 53 checklist rows: what to check, the finding, rating, recommendation, price book code, both prices, and the plain-words message for the customer.

## Stack (keep it simple and standard, so a freelance developer can take over)

- Next.js (App Router) + TypeScript + Tailwind CSS, deployed on Vercel (every push gives a preview link Nadav opens on his phone).
- Supabase later (phase 2) for the database, tech login and photo storage.
- Installable web app (PWA). Offline use in basements comes in phase 3, with a developer's help.
- Keep all prices, rules and legal texts in data/config files, never hard-coded inside components.

## Phases

1. **Customer page with sample data**: the check-up report and the service-call estimate, exactly like the mockups, reading real items and prices from the CSVs, deployed on Vercel. No database yet. ← start here
2. Tech app + database (Supabase): build a check-up, save it, generate the customer link, store approvals and signatures.
3. Housecall Pro API (create jobs on approval, receive paid-job webhooks), offline mode, security review (bring in a developer).
4. Office dashboard: reminders, weekly tech bonus, partner scorecard.

## Open tasks

`docs/task-list.md` — decisions pending, questions for the Housecall Pro demo, what to build next. Keep it up to date.

## How to work with Nadav

- Small steps. After each step: commit, push, tell him in two or three plain sentences what changed and give him the preview link.
- Ask before changing any business rule above. Flag guesses clearly.
- No secrets in the code or chat: API keys go into Vercel/Supabase settings, which Nadav enters himself.
