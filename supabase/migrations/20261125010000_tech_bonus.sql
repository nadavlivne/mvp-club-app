-- MVP Club app — weekly tech bonus. Safe to run more than once.
-- Paste into Supabase → SQL Editor → Run.
--
-- Paid revenue per van per week (before sales tax, no membership fees). Until Housecall Pro
-- sends paid jobs (phase 3), an admin types the week's total from the Housecall Pro report.
-- Only the app's server reads and writes this table (secret key).
create table if not exists public.van_week_revenue (
  week_start date not null, -- the Monday of the week (Mon–Sun, Cincinnati time)
  van text not null,
  revenue numeric not null check (revenue >= 0),
  note text not null default '',
  entered_by text not null default '',
  updated_at timestamptz not null default now(),
  primary key (week_start, van)
);
alter table public.van_week_revenue enable row level security;
revoke all on public.van_week_revenue from anon, authenticated;
grant all on public.van_week_revenue to service_role;
