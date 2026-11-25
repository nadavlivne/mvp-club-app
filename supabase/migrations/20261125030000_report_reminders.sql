-- MVP Club app — follow-up reminders on check-up report items. Safe to run more than once.
-- Paste into Supabase → SQL Editor → Run.
-- One row when the office sends (or skips) a reminder, so it leaves the "Due" list.
create table if not exists public.report_reminders (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.customer_links (id) on delete cascade,
  item_key text not null,
  stage int not null, -- 0 = first reminder for the item's rating, 1 = second
  outcome text not null check (outcome in ('sent', 'skipped')),
  message text not null default '',
  done_by text not null default '',
  done_at timestamptz not null default now(),
  unique (link_id, item_key, stage)
);
alter table public.report_reminders enable row level security;
revoke all on public.report_reminders from anon, authenticated;
grant all on public.report_reminders to service_role;
