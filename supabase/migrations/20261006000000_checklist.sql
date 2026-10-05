-- MVP Club app — the check-up checklist (Inspection Guide) in the database, edited from the
-- Google Sheet like the price list. Safe to run more than once.
-- Until this table has rows, the app keeps using data/inspection_guide.csv.

create table if not exists public.inspection_guide (
  id text primary key,
  sort int not null, -- order of the rows in the sheet (areas show in this order)
  trade text not null check (trade in ('Electrical', 'HVAC', 'Plumbing')),
  area text not null,
  how_to_check text not null default '',
  finding text not null,
  rating text not null check (rating in ('RED', 'ORANGE', 'YELLOW', 'GREEN')),
  recommend text not null default '',
  pricebook_code text not null default '', -- a price list code, "Quote", or empty (no charge)
  customer_title text not null,
  customer_message text not null,
  who_can_check text not null default 'Any trained tech',
  updated_at timestamptz not null default now()
);
alter table public.inspection_guide enable row level security;
revoke all on public.inspection_guide from anon, authenticated;
grant all on public.inspection_guide to service_role;

-- One history for price list and checklist changes.
alter table public.price_book_versions add column if not exists kind text not null default 'prices';
