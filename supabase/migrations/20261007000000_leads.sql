-- MVP Club app — website sign-ups ("Join the club") and incoming leads.
-- A row is saved as soon as someone gives their name and phone, so people who stop
-- halfway still show up for the office. Safe to run more than once.
-- Card details are never stored here: payment is set up in Housecall Pro.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null default 'website-join',
  -- started = stopped before finishing; signed_up = finished the form;
  -- contacted / joined / lost = set by the office.
  status text not null default 'started' check (status in ('started', 'signed_up', 'contacted', 'joined', 'lost')),
  step int not null default 1, -- furthest step reached in the form
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  email text not null default '',
  street text not null default '',
  city text not null default '',
  zip text not null default '',
  in_area boolean,
  systems int,
  plan text check (plan in ('monthly', 'yearly')),
  price numeric, -- monthly or yearly price shown when they chose
  preferred_time text not null default '',
  notes text not null default '', -- from the customer
  terms_text text, -- the exact wording they agreed to
  signature text, -- finger signature (PNG data URL)
  signed_at timestamptz,
  office_notes text not null default '',
  handled_by text not null default '',
  handled_at timestamptz
);
create index if not exists leads_created_idx on public.leads (created_at desc);

-- Only the server (secret key) reads and writes leads; office pages check the staff role first.
alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;
grant all on public.leads to service_role;

-- Sign-ups taken on the tech's tablet during a visit (source = 'tech').
alter table public.leads add column if not exists tech_id uuid references public.techs (id) on delete set null;
alter table public.leads add column if not exists visit_id uuid references public.visits (id) on delete set null;
create index if not exists leads_visit_idx on public.leads (visit_id);
