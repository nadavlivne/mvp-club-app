-- MVP Club app — database setup (phase 2).
-- Paste this whole file into Supabase → SQL Editor → Run. Safe to run once on a new project.
--
-- Housecall Pro stays the system for customers, scheduling, invoices and payments.
-- These tables hold only what Housecall Pro can't: the check-up / estimate work,
-- the customer's private link, and their approval.
--
-- Security: every table has Row Level Security. Techs only see their own visits.
-- Customer links and approvals are never readable from the browser; the app's
-- server reads them with the secret key after checking the link token.

-- ---------- Techs ----------
-- One row per login. Created automatically when you add a user in
-- Authentication → Users; then set the name and van in Table Editor → techs.
create table public.techs (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  van text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.techs (id, name) values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Visits ----------
-- Today's jobs per tech. Phase 3 fills this from Housecall Pro (hcp_job_id).
create table public.visits (
  id uuid primary key default gen_random_uuid(),
  tech_id uuid not null references public.techs (id) on delete cascade,
  visit_date date not null,
  time_window text not null default '',
  kind text not null check (kind in ('checkup', 'service')),
  season text check (season in ('spring', 'fall')),
  trade text,
  complaint text,
  customer jsonb not null, -- { name, isMember, memberSince }
  address text not null default '',
  home_year int,
  equipment jsonb not null default '[]',
  hcp_job_id text unique,
  created_at timestamptz not null default now()
);
create index visits_tech_date on public.visits (tech_id, visit_date);

-- ---------- The tech's work on a visit ----------
-- Checklist, findings, estimate options, notes and photo references (JSON).
create table public.visit_work (
  visit_id uuid primary key references public.visits (id) on delete cascade,
  work jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

-- ---------- Customer links ----------
-- The private link texted to the customer. `view` is a frozen copy of the report
-- or estimate (items and prices from the price book at the moment it was sent).
create table public.customer_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  visit_id uuid not null references public.visits (id) on delete cascade,
  kind text not null check (kind in ('report', 'estimate')),
  view jsonb not null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

-- ---------- Approvals ----------
create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.customer_links (id) on delete cascade,
  details jsonb not null, -- items, total, day, time window, joined club
  signature text not null, -- PNG image of the finger signature
  legal_text text not null, -- the exact notice shown when they signed
  user_agent text,
  created_at timestamptz not null default now()
);
create index approvals_link on public.approvals (link_id);

-- ---------- Row Level Security ----------
alter table public.techs enable row level security;
alter table public.visits enable row level security;
alter table public.visit_work enable row level security;
alter table public.customer_links enable row level security;
alter table public.approvals enable row level security;

-- Is this visit assigned to the signed-in tech?
create function public.is_my_visit(v uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.visits where id = v and tech_id = (select auth.uid()));
$$;

create policy "tech reads own profile" on public.techs
  for select to authenticated using (id = (select auth.uid()));

create policy "tech reads own visits" on public.visits
  for select to authenticated using (tech_id = (select auth.uid()));

create policy "tech reads own work" on public.visit_work
  for select to authenticated using (public.is_my_visit(visit_id));
create policy "tech adds own work" on public.visit_work
  for insert to authenticated with check (public.is_my_visit(visit_id));
create policy "tech updates own work" on public.visit_work
  for update to authenticated using (public.is_my_visit(visit_id)) with check (public.is_my_visit(visit_id));

-- customer_links and approvals: no policies on purpose (server only).

-- Tables are not exposed automatically on this project, so grant exactly what the app needs.
revoke all on public.techs, public.visits, public.visit_work, public.customer_links, public.approvals from anon, authenticated;
grant select on public.techs, public.visits to authenticated;
grant select, insert, update on public.visit_work to authenticated;
grant all on public.techs, public.visits, public.visit_work, public.customer_links, public.approvals to service_role;

-- ---------- Photos ----------
-- Private bucket. Files are stored as <visit id>/<random>.jpg.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 5242880, array['image/jpeg', 'image/png']);

create policy "tech uploads photos for own visits" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and public.is_my_visit(((storage.foldername(name))[1])::uuid));

create policy "tech views photos for own visits" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and public.is_my_visit(((storage.foldername(name))[1])::uuid));
