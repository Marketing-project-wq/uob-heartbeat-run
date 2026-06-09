-- ============================================================
--  TEAMS — Road to UOB Heartbeat Run × 20FIT
--  ------------------------------------------------------------
--  Run once in Supabase → SQL Editor. Lets users create a team,
--  invite mates via a link, and see only their team's progress.
-- ============================================================

create table if not exists uob_teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid references auth.users(id) on delete cascade,
  invite_code text unique not null,
  created_at  timestamptz default now()
);

create table if not exists uob_team_members (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  team_id    uuid references uob_teams(id) on delete cascade,
  status     text default 'joined',         -- joined | denied
  created_at timestamptz default now()
);

alter table uob_teams        enable row level security;
alter table uob_team_members enable row level security;

drop policy if exists "teams read"       on uob_teams;
create policy "teams read"       on uob_teams for select to authenticated using (true);
drop policy if exists "teams insert own" on uob_teams;
create policy "teams insert own" on uob_teams for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "tm read"       on uob_team_members;
create policy "tm read"       on uob_team_members for select to authenticated using (true);
drop policy if exists "tm insert own" on uob_team_members;
create policy "tm insert own" on uob_team_members for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "tm update own" on uob_team_members;
create policy "tm update own" on uob_team_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Look up a team by its invite code (so an invitee can see the team name
-- before joining, even before logging in). SECURITY DEFINER = bypasses RLS.
create or replace function uob_team_by_code(p_code text)
returns table(id uuid, name text, member_count bigint)
language sql security definer set search_path = public as $$
  select t.id, t.name,
         (select count(*) from uob_team_members m where m.team_id = t.id and m.status = 'joined')
  from uob_teams t
  where t.invite_code = p_code
  limit 1
$$;
grant execute on function uob_team_by_code(text) to anon, authenticated;
