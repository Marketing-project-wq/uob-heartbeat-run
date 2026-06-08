-- ============================================================
--  LEADERBOARD CROSS-ACCOUNT SYNC
--  Road to UOB Heartbeat Run × 20FIT
--  ------------------------------------------------------------
--  Makes every account see the SAME standings. Run once in
--  Supabase → SQL Editor.
--
--  Why it was inconsistent:
--   1) Manual runs didn't refresh the weekly leaderboard snapshot
--      (fixed in the app now — every saved run recalculates it).
--   2) The leaderboard views/tables were only readable per-user, so
--      each account saw only its own row. The statements below let
--      all signed-in users READ the shared standings.
-- ============================================================

-- Weekly snapshot table: everyone can read all rows
alter table uob_leaderboard enable row level security;
drop policy if exists "lb read all" on uob_leaderboard;
create policy "lb read all" on uob_leaderboard
  for select to authenticated using (true);

-- Make the leaderboard VIEWS run with the owner's privileges so they can
-- aggregate everyone's data (Postgres 15+). Safe no-op if not applicable.
do $$
begin
  begin execute 'alter view uob_leaderboard_daily  set (security_invoker = false)'; exception when others then null; end;
  begin execute 'alter view uob_leaderboard_season set (security_invoker = false)'; exception when others then null; end;
end $$;

-- Make sure signed-in users (and the anon role used before login) can read them
grant select on uob_leaderboard_daily  to authenticated, anon;
grant select on uob_leaderboard_season to authenticated, anon;

-- Quick check — should list ALL runners, not just you:
--   select * from uob_leaderboard_season order by rank;
