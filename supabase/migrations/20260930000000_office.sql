-- MVP Club app — office area (roles + scheduling). Safe to run more than once.
-- Paste into Supabase → SQL Editor → Run, after the first setup file.

-- ---------- Office staff ----------
-- admin: everything (revenue, bonuses, price list, techs)
-- office: approved jobs and scheduling, no revenue or bonus totals
create table if not exists public.staff (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'office')),
  name text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.staff enable row level security;

drop policy if exists "staff reads own row" on public.staff;
create policy "staff reads own row" on public.staff
  for select to authenticated using (id = (select auth.uid()));

revoke all on public.staff from anon, authenticated;
grant select on public.staff to authenticated;
grant all on public.staff to service_role;

-- ---------- Scheduling of approved jobs ----------
-- Until Housecall Pro does it automatically (phase 3), the office ticks "Scheduled".
alter table public.approvals add column if not exists scheduled_at timestamptz;
alter table public.approvals add column if not exists scheduled_by uuid references auth.users (id);
