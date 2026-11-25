-- MVP Club app — mark approved jobs as paid. Safe to run more than once.
-- Paste into Supabase → SQL Editor → Run.
-- The $25 report-item bonus counts in the week the customer PAYS (not when they approve).
-- Until Housecall Pro sends paid-job messages (phase 3), the office marks the job paid.
alter table public.approvals add column if not exists paid_at timestamptz;
alter table public.approvals add column if not exists paid_by uuid references auth.users (id);
create index if not exists approvals_paid_idx on public.approvals (paid_at);
