-- ============================================================
--  ADMIN DASHBOARD — skema (allowlist admin + jejak + RPC guard)
--  Road to UOB Heartbeat Run x 20FIT
--  ------------------------------------------------------------
--  Dokumentasi skema yang dipakai halaman /admin. Idempotent.
--  Semua akses data admin lewat RPC SECURITY DEFINER ber-guard
--  uob_is_admin() — TIDAK ADA service_role di frontend.
--  Input asli user (uob_users / uob_activities) tidak ditimpa;
--  koreksi admin dicatat di uob_admin_edits.
--
--  CATATAN: akun admin (email+password) DIBUAT lewat Supabase Auth
--  (auth.users + auth.identities provider 'email'), lalu user_id-nya
--  dimasukkan ke uob_admins. JANGAN simpan password di file ini / git.
-- ============================================================

-- 1) Allowlist admin + jejak koreksi admin
create table if not exists public.uob_admins (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  email    text,
  added_at timestamptz default now(),
  added_by uuid
);
alter table public.uob_admins enable row level security;

create table if not exists public.uob_admin_edits (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid,
  admin_email  text,
  target_table text,           -- 'uob_users' | 'uob_activities'
  target_id    text,
  changes      jsonb,          -- { field: {from, to}, ... }
  note         text,
  created_at   timestamptz default now()
);
alter table public.uob_admin_edits enable row level security;

-- 2) Guard: apakah uid seorang admin? (definer -> baca uob_admins bypass RLS)
create or replace function public.uob_is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.uob_admins a where a.user_id = uid);
$$;
grant execute on function public.uob_is_admin(uuid) to authenticated, anon;

-- 3) RLS: hanya admin yang boleh baca tabel admin. Tulis lewat RPC (definer).
drop policy if exists "admins read" on public.uob_admins;
create policy "admins read" on public.uob_admins
  for select to authenticated using (public.uob_is_admin(auth.uid()));
drop policy if exists "admin edits read" on public.uob_admin_edits;
create policy "admin edits read" on public.uob_admin_edits
  for select to authenticated using (public.uob_is_admin(auth.uid()));

-- 3b) Wajib ganti password saat login pertama (flag + RPC)
alter table public.uob_admins add column if not exists must_change_pw boolean not null default false;

create or replace function public.uob_admin_status()
returns json language plpgsql stable security definer set search_path = public as $$
declare v_must boolean;
begin
  if not public.uob_is_admin(auth.uid()) then raise exception 'not_authorized' using errcode='42501'; end if;
  select must_change_pw into v_must from public.uob_admins where user_id = auth.uid();
  return json_build_object('is_admin', true, 'must_change_pw', coalesce(v_must,false));
end $$;
grant execute on function public.uob_admin_status() to authenticated;

create or replace function public.uob_admin_password_changed()
returns json language plpgsql security definer set search_path = public as $$
begin
  if not public.uob_is_admin(auth.uid()) then raise exception 'not_authorized' using errcode='42501'; end if;
  update public.uob_admins set must_change_pw = false where user_id = auth.uid();
  return json_build_object('ok', true);
end $$;
grant execute on function public.uob_admin_password_changed() to authenticated;

-- Cara buat/tandai admin (JANGAN simpan password di file/git):
--   update auth.users set encrypted_password = crypt('<temp-pw>', gen_salt('bf')) where email='<admin-email>';
--   insert into public.uob_admins(user_id, email, must_change_pw)
--     select id, email, true from auth.users where email='<admin-email>'
--     on conflict (user_id) do update set must_change_pw = true;

-- 4) KPI ringkas
create or replace function public.uob_admin_stats()
returns json language plpgsql stable security definer set search_path = public as $$
declare j json;
begin
  if not public.uob_is_admin(auth.uid()) then raise exception 'not_authorized' using errcode='42501'; end if;
  select json_build_object(
    'total_accounts', (select count(*) from uob_users),
    'onboarded',      (select count(distinct user_id) from uob_activities),
    'total_runs',     (select count(*) from uob_activities),
    'needs_review',   (select count(*) from uob_activities where not coalesce(proof_valid,false) and coalesce(proof_status,'') <> 'invalid'),
    'valid_runs',     (select count(*) from uob_activities where proof_valid is true),
    'invalid_runs',   (select count(*) from uob_activities where proof_status='invalid'),
    'valid_km',       (select coalesce(sum(distance_km),0) from uob_activities where proof_valid is true),
    'onboarded_female',(select count(distinct a.user_id) from uob_activities a join uob_users u on u.id=a.user_id where u.gender='Female'),
    'onboarded_male',  (select count(distinct a.user_id) from uob_activities a join uob_users u on u.id=a.user_id where u.gender='Male'),
    'onboarded_no_gender',(select count(distinct a.user_id) from uob_activities a join uob_users u on u.id=a.user_id where u.gender is null or u.gender not in ('Male','Female'))
  ) into j;
  return j;
end $$;
grant execute on function public.uob_admin_stats() to authenticated;

-- 5) Daftar peserta ONBOARDED (akun + >=1 run) + ringkasan + filter tanggal (WIB)
--    p_from/p_to opsional; null = seluruh periode (perilaku default).
create or replace function public.uob_admin_users(
  p_search text default null, p_gender text default null, p_status text default null,
  p_from date default null, p_to date default null
)
returns table(
  user_id uuid, full_name text, email text, phone text, nik text, gender text,
  kcp text, team text, created_at timestamptz,
  total_runs bigint, valid_runs bigint, pending_runs bigint, invalid_runs bigint,
  total_km numeric, valid_km numeric, last_run_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.uob_is_admin(auth.uid()) then raise exception 'not_authorized' using errcode='42501'; end if;
  return query
  select u.id, u.full_name::text, u.email::text, u.phone::text, u.nik::text, u.gender::text,
         u.department::text, u.team::text, u.updated_at,
         agg.total_runs, agg.valid_runs, agg.pending_runs, agg.invalid_runs,
         agg.total_km, agg.valid_km, agg.last_run_at
  from uob_users u
  join lateral (
    select count(*) as total_runs,
           count(*) filter (where a.proof_valid is true) as valid_runs,
           count(*) filter (where a.proof_status='invalid') as invalid_runs,
           count(*) filter (where not coalesce(a.proof_valid,false) and coalesce(a.proof_status,'') <> 'invalid') as pending_runs,
           coalesce(sum(a.distance_km),0) as total_km,
           coalesce(sum(a.distance_km) filter (where a.proof_valid is true),0) as valid_km,
           max(a.recorded_at) as last_run_at
    from uob_activities a
    where a.user_id = u.id
      and (p_from is null or (a.recorded_at at time zone 'Asia/Jakarta')::date >= p_from)
      and (p_to   is null or (a.recorded_at at time zone 'Asia/Jakarta')::date <= p_to)
  ) agg on true
  where agg.total_runs > 0
    and (coalesce(p_search,'')='' or u.full_name ilike '%'||p_search||'%' or u.email ilike '%'||p_search||'%' or coalesce(u.nik,'') ilike '%'||p_search||'%')
    and (coalesce(p_gender,'')='' or lower(coalesce(u.gender,''))=lower(p_gender))
    and (coalesce(p_status,'')=''
         or (p_status='pending' and agg.pending_runs>0)
         or (p_status='valid'   and agg.valid_runs>0)
         or (p_status='invalid' and agg.invalid_runs>0)
         or (p_status='no_gender' and (u.gender is null or u.gender not in ('Male','Female'))))
  order by agg.valid_km desc, agg.total_km desc;
end $$;
grant execute on function public.uob_admin_users(text,text,text,date,date) to authenticated;

-- 6) Antrian review (foto + KM), approve/reject, Top KM per gender
create or replace function public.uob_admin_review_queue(p_limit int default 100, p_offset int default 0)
returns table(
  activity_id uuid, user_id uuid, full_name text, email text, gender text,
  distance_km numeric, photo_url text, proof_status text, source text, recorded_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.uob_is_admin(auth.uid()) then raise exception 'not_authorized' using errcode='42501'; end if;
  return query
  select a.id, a.user_id, u.full_name::text, u.email::text, u.gender::text,
         a.distance_km, a.photo_url::text, a.proof_status::text, a.source::text, a.recorded_at
  from uob_activities a join uob_users u on u.id = a.user_id
  where not coalesce(a.proof_valid,false) and coalesce(a.proof_status,'') <> 'invalid'
  order by a.recorded_at desc
  limit greatest(1, least(p_limit, 500)) offset greatest(0, p_offset);
end $$;
grant execute on function public.uob_admin_review_queue(int,int) to authenticated;

create or replace function public.uob_admin_set_validation(
  p_activity_id uuid, p_decision text, p_reason text default null
)
returns json language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_km numeric; v_email text; v_valid boolean; v_status text;
begin
  if not public.uob_is_admin(auth.uid()) then raise exception 'not_authorized' using errcode='42501'; end if;
  if p_decision not in ('approve','reject') then raise exception 'bad_decision'; end if;
  select user_id, distance_km into v_uid, v_km from uob_activities where id = p_activity_id;
  if v_uid is null then raise exception 'activity_not_found'; end if;
  select email into v_email from uob_admins where user_id = auth.uid();
  v_valid  := (p_decision = 'approve');
  v_status := case when v_valid then 'admin_verified' else 'invalid' end;
  update uob_activities set proof_valid = v_valid, proof_status = v_status, updated_at = now()
    where id = p_activity_id;
  insert into uob_run_validations(activity_id, user_id, km_input, status, method, reason, validated_by)
  values (p_activity_id, v_uid, v_km, case when v_valid then 'valid' else 'invalid' end,
          'admin', p_reason, coalesce(v_email, auth.uid()::text));
  return json_build_object('ok', true, 'proof_valid', v_valid, 'proof_status', v_status);
end $$;
grant execute on function public.uob_admin_set_validation(uuid,text,text) to authenticated;

create or replace function public.uob_admin_top_km(p_gender text, p_limit int default 100)
returns table(rank bigint, user_id uuid, full_name text, kcp text, team text, total_km_valid numeric, valid_runs bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.uob_is_admin(auth.uid()) then raise exception 'not_authorized' using errcode='42501'; end if;
  return query
  select row_number() over (order by s.total_km_valid desc, s.first_valid_at asc) as rank,
         s.user_id, s.full_name::text, s.department::text, s.team::text, s.total_km_valid, s.valid_runs
  from uob_leaderboard_valid_season s
  where lower(coalesce(s.gender,'')) = lower(p_gender)
  order by s.total_km_valid desc, s.first_valid_at asc
  limit greatest(1, least(p_limit, 500));
end $$;
grant execute on function public.uob_admin_top_km(text,int) to authenticated;

-- 7) Edit peserta / log run (TIPE B: lengkapi/koreksi) + jejak audit
create or replace function public.uob_admin_edit_user(p_user_id uuid, p_patch jsonb, p_note text default null)
returns json language plpgsql security definer set search_path = public as $$
declare v_email text; v_changes jsonb := '{}'::jsonb; v_old record; k text; allowed text[] := array['full_name','phone','gender','department','team','nik'];
begin
  if not public.uob_is_admin(auth.uid()) then raise exception 'not_authorized' using errcode='42501'; end if;
  select email into v_email from uob_admins where user_id = auth.uid();
  select full_name, phone, gender, department, team, nik into v_old from uob_users where id = p_user_id;
  if not found then raise exception 'user_not_found'; end if;
  foreach k in array allowed loop
    if p_patch ? k then
      v_changes := v_changes || jsonb_build_object(k, jsonb_build_object(
        'from', case k when 'full_name' then v_old.full_name when 'phone' then v_old.phone when 'gender' then v_old.gender when 'department' then v_old.department when 'team' then v_old.team when 'nik' then v_old.nik end,
        'to', p_patch->>k));
    end if;
  end loop;
  if v_changes = '{}'::jsonb then return json_build_object('ok', false, 'reason', 'no_allowed_fields'); end if;
  update uob_users set
    full_name  = case when p_patch ? 'full_name'  then p_patch->>'full_name'  else full_name  end,
    phone      = case when p_patch ? 'phone'       then p_patch->>'phone'       else phone      end,
    gender     = case when p_patch ? 'gender'      then p_patch->>'gender'      else gender     end,
    department = case when p_patch ? 'department'  then p_patch->>'department'  else department end,
    team       = case when p_patch ? 'team'        then p_patch->>'team'        else team       end,
    nik        = case when p_patch ? 'nik'         then p_patch->>'nik'         else nik        end,
    updated_at = now()
  where id = p_user_id;
  insert into uob_admin_edits(admin_id, admin_email, target_table, target_id, changes, note)
  values (auth.uid(), v_email, 'uob_users', p_user_id::text, v_changes, p_note);
  return json_build_object('ok', true, 'changes', v_changes);
end $$;
grant execute on function public.uob_admin_edit_user(uuid,jsonb,text) to authenticated;

create or replace function public.uob_admin_edit_run(p_activity_id uuid, p_patch jsonb, p_note text default null)
returns json language plpgsql security definer set search_path = public as $$
declare v_email text; v_changes jsonb := '{}'::jsonb; v_old record;
begin
  if not public.uob_is_admin(auth.uid()) then raise exception 'not_authorized' using errcode='42501'; end if;
  select email into v_email from uob_admins where user_id = auth.uid();
  select distance_km, recorded_at into v_old from uob_activities where id = p_activity_id;
  if not found then raise exception 'activity_not_found'; end if;
  if p_patch ? 'distance_km' then
    v_changes := v_changes || jsonb_build_object('distance_km', jsonb_build_object('from', v_old.distance_km, 'to', (p_patch->>'distance_km')::numeric));
  end if;
  if p_patch ? 'recorded_at' then
    v_changes := v_changes || jsonb_build_object('recorded_at', jsonb_build_object('from', v_old.recorded_at, 'to', p_patch->>'recorded_at'));
  end if;
  if v_changes = '{}'::jsonb then return json_build_object('ok', false, 'reason', 'no_allowed_fields'); end if;
  update uob_activities set
    distance_km = case when p_patch ? 'distance_km' then (p_patch->>'distance_km')::numeric else distance_km end,
    recorded_at = case when p_patch ? 'recorded_at' then (p_patch->>'recorded_at')::timestamptz else recorded_at end,
    updated_at = now()
  where id = p_activity_id;
  insert into uob_admin_edits(admin_id, admin_email, target_table, target_id, changes, note)
  values (auth.uid(), v_email, 'uob_activities', p_activity_id::text, v_changes, p_note);
  return json_build_object('ok', true, 'changes', v_changes);
end $$;
grant execute on function public.uob_admin_edit_run(uuid,jsonb,text) to authenticated;
