-- ============================================================
-- VIRTUAL RUN UOB — race-day one-time submission table
-- Road to UOB Heartbeat Run × 20FIT
-- Run this ONCE in Supabase → SQL Editor → New query → Run.
-- ------------------------------------------------------------
-- Used by virtual-run.html (the separate "Virtual Run UOB" page).
-- No login: participants submit with anon key. "Submit once only"
-- is enforced by the UNIQUE (nik) constraint.
-- ============================================================

create table if not exists public.uob_virtual_run (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  email        text,
  phone        text,
  nik          text not null unique,        -- one submission per NIK
  kcp          text,
  distance_km  numeric not null check (distance_km >= 0),
  created_at   timestamptz not null default now()
);

-- Leaderboard query helper
create index if not exists uob_virtual_run_km_idx on public.uob_virtual_run (distance_km desc);

-- Row Level Security: allow anonymous insert (once, via unique nik) + read.
alter table public.uob_virtual_run enable row level security;

drop policy if exists vr_anon_insert on public.uob_virtual_run;
create policy vr_anon_insert on public.uob_virtual_run
  for insert to anon, authenticated
  with check (true);

drop policy if exists vr_anon_select on public.uob_virtual_run
;
create policy vr_anon_select on public.uob_virtual_run
  for select to anon, authenticated
  using (true);

-- Note: no UPDATE/DELETE policy → entries are immutable once submitted.
