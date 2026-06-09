-- ============================================================
--  TEAMS — allow joining MULTIPLE teams + owner manage (rename/delete)
--  Run once in Supabase → SQL Editor (after supabase-teams.sql).
-- ============================================================

-- 1) Let one user be in many teams: composite primary key (team_id, user_id)
alter table uob_team_members drop constraint if exists uob_team_members_pkey;
alter table uob_team_members add primary key (team_id, user_id);

-- 2) Owner can rename/delete their team; members can leave
drop policy if exists "teams update own" on uob_teams;
create policy "teams update own" on uob_teams
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "teams delete own" on uob_teams;
create policy "teams delete own" on uob_teams
  for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "tm delete own" on uob_team_members;
create policy "tm delete own" on uob_team_members
  for delete to authenticated using (user_id = auth.uid());
