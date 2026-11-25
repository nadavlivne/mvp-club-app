-- MVP Club app — "nearby check-up" offers. Safe to run more than once.
-- Paste into Supabase → SQL Editor → Run.
-- One row each time the office offers a member a check-up slot next to a booked job,
-- so the same member isn't texted twice. Members come from leads marked "Joined" until
-- Housecall Pro is connected (phase 3).
create table if not exists public.nearby_offers (
  id uuid primary key default gen_random_uuid(),
  member_lead_id uuid not null references public.leads (id) on delete cascade,
  visit_id uuid references public.visits (id) on delete set null,
  offer_date date not null,
  message text not null,
  offered_by text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists nearby_offers_member_idx on public.nearby_offers (member_lead_id, created_at desc);
alter table public.nearby_offers enable row level security;
revoke all on public.nearby_offers from anon, authenticated;
grant all on public.nearby_offers to service_role;
