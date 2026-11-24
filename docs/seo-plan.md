# MVP Club — SEO plan

Goal: show up on Google (map and regular results) for heating & cooling, plumbing and electrical searches in Greater Cincinnati, and turn those visits into calls and memberships.

The weekly SEO agent reads this file every run, works on the next items, and adds a line to the log at the bottom.

## Rules (always)

- Only true facts. No invented reviews, years, licenses, awards, "24/7" or "same day".
- No prices on public pages except the service call ($19 members / $119 non-members), unless Nadav approves.
- Ohio only. Kentucky and Indiana pages wait until the partners' licenses there are in `config/trust.ts`.
- New public pages need `robots: { index: true, follow: true }` in their metadata (the site blocks Google by default) and must be added to `app/sitemap.ts`.
- Nothing goes live without Nadav: work on a branch, open a pull request, give him the Vercel preview link.

## Phase 1 — Foundation (Nadav)

- [ ] MVP's own phone number and address in `config/site.ts`
- [ ] Google Business Profile: HVAC contractor (main) + Electrician + Plumber, service area, address hidden
- [ ] Google Search Console + Bing Webmaster Tools, sitemap submitted
- [ ] Housecall Pro: automatic review request after every job

## Phase 2 — First month

- [ ] Listings with the same name, phone and address: Bing Places, Apple Business Connect, Yelp, Nextdoor, BBB, Angi
- [ ] Apply for Google Local Services Ads (license and insurance checks through the trade partners)
- [ ] Links from Galley Electric and Renew Mechanical websites, Cincinnati chamber of commerce
- [ ] Real job photos and a weekly Google Business Profile post

## Phase 3 — Every month

- 2–4 new helpful pages under /guides answering what homeowners search for, timed to the season (fall/winter: furnace and frozen pipes; spring/summer: AC and storms/sump pumps).
- Add a real local detail to town pages (a job or a review from that town) when Nadav provides one.
- Track progress against the target searches below.

## Target searches

| Search | Page |
| --- | --- |
| furnace repair cincinnati | /services/furnace-repair |
| ac repair cincinnati | /services/ac-repair |
| water heater replacement cincinnati | /services/water-heater |
| electrician cincinnati | /services/electrical |
| plumber cincinnati | /services/plumbing |
| electrical panel upgrade cincinnati | /services/electrical-panel |
| ev charger installation cincinnati | /services/ev-charger-installation |
| hvac maintenance plan cincinnati | / |
| home maintenance membership cincinnati | / |
| furnace repair west chester oh | /areas/west-chester |
| ac repair mason oh | /areas/mason |
| electrician blue ash | /areas/blue-ash |
| plumber anderson township | /areas/anderson-township |
| hvac hyde park cincinnati | /areas/hyde-park |
| plumber liberty township oh | /areas/liberty-township |

## Ideas for guides (pick by season)

- Furnace clicks but won't light — what it means
- How long does a water heater last? Signs it's time
- Breaker keeps tripping — when to call an electrician
- How to find and test your main water shut-off
- AC running but not cooling — what to check first
- Do I need a 200-amp panel for an EV charger?
- Sump pump check before spring rains
- Frozen pipes: prevention and what to do

## Log

- 2026-11-23 — Built 8 service pages and 25 Ohio town pages, trust section, credit breakdown, contractor footer (PR #7). Plan written.
