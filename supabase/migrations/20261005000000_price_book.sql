-- MVP Club app — price list in the database (edited from the office). Safe to run more than once.
-- Paste into Supabase → SQL Editor → Run.
--
-- Until this table has rows, the app keeps using data/pricebook.csv.
-- Only the app's server reads and writes these tables (secret key); no browser access.

create table if not exists public.price_book (
  code text primary key,
  trade text not null,
  category text not null,
  task text not null,
  est_hours text not null default '',
  standard_price numeric not null check (standard_price >= 0),
  member_price numeric not null check (member_price >= 0),
  rate_type text not null check (rate_type in ('Service', 'Install')),
  credit_tier text not null default '' check (credit_tier in ('', 'Small', 'Medium', 'Large')),
  notes text not null default '',
  updated_at timestamptz not null default now()
);

-- Every published change: who, when, and what changed (for the history list).
create table if not exists public.price_book_versions (
  id uuid primary key default gen_random_uuid(),
  published_at timestamptz not null default now(),
  published_by uuid references auth.users (id),
  published_by_name text not null default '',
  file_name text not null default '',
  row_count int not null,
  changes jsonb not null -- { added: [...], removed: [...], changed: [...] }
);

alter table public.price_book enable row level security;
alter table public.price_book_versions enable row level security;
revoke all on public.price_book, public.price_book_versions from anon, authenticated;
grant all on public.price_book, public.price_book_versions to service_role;

-- App settings (e.g. the Google Sheet the price list syncs from, and the last sync result).
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
grant all on public.app_settings to service_role;
