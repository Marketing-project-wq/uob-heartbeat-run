-- ============================================================
--  AUTO-SYNC: Automatically create uob_users profile when
--  a new Supabase auth user is created (signup).
--
--  This ensures login checks against uob_users work for all
--  users who successfully signed up. Run this in Supabase
--  SQL Editor once to set up the trigger.
-- ============================================================

-- Create function that runs when new auth.users are created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.uob_users (id, email, created_at, updated_at)
  values (new.id, new.email, now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger on auth.users that calls the function
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Sync existing users who don't have uob_users rows yet
insert into public.uob_users (id, email, created_at, updated_at)
select id, email, created_at, now()
from auth.users
where id not in (select id from public.uob_users)
on conflict (id) do nothing;

-- Verify the sync worked
select count(*) as total_auth_users,
       (select count(*) from public.uob_users) as total_profiles,
       (select count(*) from auth.users au where au.id not in (select id from uob_users)) as missing_profiles
from auth.users;
