-- ============================================================
--  PRE-LAUNCH RESET — Road to UOB Heartbeat Run × 20FIT
--  Bersihkan SEMUA data (main app + virtual run) sebelum launch.
--  Jalankan di Supabase → SQL Editor → New query → Run.
--  PERMANEN — tidak bisa di-undo. Jalankan hanya saat siap launch.
-- ============================================================

-- 1) Main app: aktivitas lari, story, reaksi, snapshot leaderboard
truncate table uob_story_reactions,
               uob_stories,
               uob_activities,
               uob_leaderboard
  restart identity cascade;

-- 2) Tim (kalau ada)
do $$ begin
  if to_regclass('public.uob_team_members') is not null then execute 'truncate table public.uob_team_members restart identity cascade'; end if;
  if to_regclass('public.uob_teams')        is not null then execute 'truncate table public.uob_teams restart identity cascade'; end if;
end $$;

-- 3) Virtual Run (produksi + testing) kalau tabelnya ada
do $$ begin
  if to_regclass('public.uob_virtual_run')      is not null then execute 'truncate table public.uob_virtual_run restart identity'; end if;
  if to_regclass('public.uob_virtual_run_test') is not null then execute 'truncate table public.uob_virtual_run_test restart identity'; end if;
end $$;

-- 4) Profil pengguna di tabel aplikasi
delete from uob_users;

-- 5) Akun login (auth) → semua orang daftar ulang dari nol (jadi NEW USER)
--    Mau sisakan akunmu sendiri? ganti baris di bawah jadi:
--    delete from auth.users where email <> 'Marketing@20fit.id';
delete from auth.users;

-- Catatan: file foto di Storage (run-proofs / avatars / vr-proofs) tidak
-- ikut terhapus oleh SQL ini (tidak masalah — hanya jadi file yatim).
-- Kalau mau bersih total, hapus manual lewat Storage di dashboard.
