-- ============================================================
--  HAPUS SEMUA DATA DUMMY  —  Road to UOB Heartbeat × 20FIT
--  ------------------------------------------------------------
--  Jalankan di: Supabase Dashboard → SQL Editor → New query → Run.
--  Ini MENGHAPUS SEMUA data uji coba supaya mulai bersih dari nol.
--  (Tidak menghapus struktur tabel — hanya isinya.)
-- ============================================================

-- 1) Hapus data aktivitas, story, reaksi, dan snapshot leaderboard
truncate table uob_story_reactions,
               uob_stories,
               uob_activities,
               uob_leaderboard
  restart identity cascade;

-- 2) Hapus profil pengguna di tabel aplikasi
delete from uob_users;

-- 3) Hapus akun login (auth) supaya semua orang bisa daftar ulang dari nol.
--    Catatan: ini menghapus SEMUA user. Kalau mau menyisakan akunmu sendiri,
--    ganti baris di bawah, mis:  delete from auth.users where email <> 'kamu@uob.co.id';
delete from auth.users;

-- Selesai. Buka aplikasi → Get Started → daftar ulang dengan data asli.
