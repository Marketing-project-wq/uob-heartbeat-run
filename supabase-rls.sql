-- ============================================================
--  RLS — make each user's data load on ANY device
--  Road to UOB Heartbeat Run × 20FIT
--  ------------------------------------------------------------
--  Run once in Supabase → SQL Editor. Guarantees a signed-in user
--  can read/write their OWN profile and runs from any device, so
--  data is never lost when logging in elsewhere.
-- ============================================================

-- uob_users: read & update your own row
alter table uob_users enable row level security;

drop policy if exists "users read own"   on uob_users;
create policy "users read own" on uob_users
  for select to authenticated using (id = auth.uid());

drop policy if exists "users update own" on uob_users;
create policy "users update own" on uob_users
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "users insert own" on uob_users;
create policy "users insert own" on uob_users
  for insert to authenticated with check (id = auth.uid());

-- Leaderboard needs to read everyone's name/branch/total:
-- expose ONLY via the leaderboard views, but if you read uob_users
-- directly for "My KCP", also allow reading basic fields of all rows:
drop policy if exists "users read all basic" on uob_users;
create policy "users read all basic" on uob_users
  for select to authenticated using (true);

-- uob_activities: read/insert/update your own runs (any device)
alter table uob_activities enable row level security;

drop policy if exists "acts read own"   on uob_activities;
create policy "acts read own" on uob_activities
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "acts insert own" on uob_activities;
create policy "acts insert own" on uob_activities
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "acts update own" on uob_activities;
create policy "acts update own" on uob_activities
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Note: keep only ONE of "users read own" / "users read all basic" depending
-- on your privacy preference. "read all basic" is needed for the My KCP board.
