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

- Tell the office (text or email) when a new lead arrives.
- A page for each trade and for the main towns (Google searches like "furnace check-up West Chester").
- Phase 3: Housecall Pro connection (after the demo), offline mode, security review with a developer.
  - The review should cover rate-limiting the website sign-up form.
- Phase 4: weekly tech bonus, partner scorecard, reminders (orange items at 3 and 5 months, yellow before the next check-up).

## Ideas not adopted (need Nadav's OK first)

- Priority scheduling for members.
- Free service call for members (now $19).
- 24/7 emergency line.
