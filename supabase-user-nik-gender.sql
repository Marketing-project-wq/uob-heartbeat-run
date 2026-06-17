-- ============================================================
--  TAMBAH KOLOM NIK + GENDER ke uob_users (untuk sign up)
--  Jalankan di Supabase → SQL Editor → Run. Aman dijalankan ulang.
-- ============================================================
alter table uob_users add column if not exists nik    text;
alter table uob_users add column if not exists gender text;

-- Lihat data pendaftar:
--   select full_name, email, nik, gender, department as kcp, phone
--   from uob_users order by updated_at desc;
