# MVP Club — open tasks

Things to decide or do that are not built yet. Newest decisions at the top of each section.

## To discuss on the Housecall Pro demo

Goal: joining (website or tech tablet) and approving work should flow into Housecall Pro with no retyping, and payment should be fully online.

1. **Memberships (service plans)**
   - Can our app create a customer and put them on a membership plan through the API?
   - Plans: MVP Club monthly $30 and yearly $330, +$10/month ($120/year) per extra heating & cooling system, 12-month first term then month to month.
2. **Online payment for memberships**
   - Can a customer pay for the membership online, right after signing up on our website?
   - Options to ask about: a Housecall Pro payment link we can open automatically, an embedded payment page, or a card-on-file request sent by text.
   - If Housecall Pro can't do this, the fallback is Stripe for the membership payment only (two systems to track).
3. **On site (tech tablet)**
   - After a customer signs up on our tablet, can the tech take the card in the Housecall Pro app in one step?
   - Can our app open the right customer and plan in the Housecall Pro app?
4. **Jobs from approvals**
   - Create a job in Housecall Pro when a customer approves a check-up item or an estimate, with the chosen day and time window.
5. **Paid-job webhooks**
   - Receive a message when a job is paid (amount before tax, tech, van), for the weekly tech bonus and revenue per van.
6. **Customer data**
   - Read customers, addresses, phone numbers and membership status, so tech visits and sign-ups are pre-filled.
   - Which system is the "source of truth" for customers?
7. **Texts**
   - Can Housecall Pro send our customer links (report / estimate) by text, or do we send them?
8. **API access**
   - Is the API included in the MAX plan?
   - Rate limits, a test (sandbox) account, how webhooks are secured.

After the demo: Nadav puts the API key into Vercel as `HOUSECALL_PRO_API_KEY` (never in chat or code).

## Waiting on Nadav

- Lead alerts by email: make a free account at resend.com, verify joinmvpclub.com there (it gives DNS records to add in Porkbun), then add in Vercel: `RESEND_API_KEY`, `OFFICE_ALERT_EMAIL` (one or more emails, comma-separated) and optionally `ALERT_FROM_EMAIL`. Until then no emails go out; leads still show in /office/leads.
- Sign-up bot check: in Cloudflare → Turnstile, add a widget for joinmvpclub.com, then add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in Vercel. Until then only the per-connection limit protects the form.
- Run `supabase/migrations/20261125000000_lead_guard.sql` in Supabase (turns on the limit of 5 new sign-ups per connection per hour).
- License numbers for the trade partners (Galley Electric, Renew Mechanical, plumbing partner) for each state we serve: Ohio, Kentucky, Indiana. They go in `config/trust.ts` and appear in the website footer.
- Trust facts for the website (`config/trust.ts`): years of experience, licensed / insured confirmed, Google reviews link, team or van photo.
- MVP's own phone number and address, to replace Yolo's (513-909-9656, 114 E 8th St) in `config/site.ts`.
- Register with Housecall Pro (MAX plan) and book the demo (questions above).
- Google Business Profile: business.google.com — MVP Club, (513) 909-9656, 114 E 8th St, Mon–Fri 8–5, joinmvpclub.com.
- Google Search Console for joinmvpclub.com (after the site is live).
- Connect joinmvpclub.com + www in Vercel/Porkbun; redirect the other domains to it.
- Own phone number for MVP Club (site uses 513-909-9656 for now).
- Photos of vans / techs / team for the website.
- More reference websites (send as PDF).

## Waiting on the attorney

All wording is in `config/legal.ts`:
- 3-business-day right to cancel (check-up approval)
- emergency waiver (service call)
- membership terms: website sign-up, tablet sign-up and the estimate's "join today"
- "not insurance, not a home warranty"

## To build next

- Town pages for Northern Kentucky and SE Indiana — only after the partners' licenses there are confirmed (Ohio service and town pages are built: `config/seo-pages.ts`).
- Add a real local line to each town page over time (a job done there, a review from there) so the pages aren't all alike.
- Phase 3: Housecall Pro connection (after the demo), offline mode, security review with a developer.
- Phase 4: partner scorecard, reminders (orange items at 3 and 5 months, yellow before the next check-up).
- Weekly tech bonus: built (/office/bonuses for admin, "My bonus" in the tech app). Revenue is typed in from Housecall Pro each week until paid-job webhooks fill it in (phase 3). Run `supabase/migrations/20261125010000_tech_bonus.sql` once.
  - To confirm with Nadav: a report item counts as "sold" when the customer approves it (not when it's paid), credited to the van of the tech who did the check-up.

## Ideas not adopted (need Nadav's OK first)

- Priority scheduling for members.
- Free service call for members (now $19).
- 24/7 emergency line.
