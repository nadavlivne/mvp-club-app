-- MVP Club app — sign-up protection. Safe to run more than once.
-- Paste into Supabase → SQL Editor → Run.
-- visitor_key is a scrambled code for the visitor's internet connection (never the real address),
-- used only to limit how many sign-ups one connection can start per hour.
alter table public.leads add column if not exists visitor_key text;
create index if not exists leads_visitor_idx on public.leads (visitor_key, created_at desc);
