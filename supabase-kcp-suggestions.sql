-- ============================================================
--  KCP SUGGESTIONS (autocomplete) — Road to UOB Heartbeat × 20FIT
--  ------------------------------------------------------------
--  Lets the login screen suggest existing branch (KCP) names so
--  people pick a consistent spelling. Run once in SQL Editor.
-- ============================================================

create or replace function uob_kcp_list()
returns table(kcp text)
language sql
security definer
set search_path = public
as $$
  select distinct department
  from uob_users
  where department is not null and btrim(department) <> ''
  order by 1
$$;

grant execute on function uob_kcp_list() to anon, authenticated;

-- (optional) Review how branches are currently spelled, to spot duplicates:
--   select department, count(*) from uob_users
--   where department is not null group by department order by 2 desc;
