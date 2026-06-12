-- ============================================================
-- VIRTUAL RUN UOB — TABEL TESTING (data terpisah dari produksi)
-- Dipakai oleh halaman /virtualrun-test. Aman dijalankan ulang.
-- Jalankan di Supabase → SQL Editor → New query → Run.
-- ============================================================

create table if not exists public.uob_virtual_run_test (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  email        text,
  phone        text,
  nik          text not null unique,
  kcp          text,
  distance_km  numeric not null check (distance_km >= 0),
  proof_url    text,
  created_at   timestamptz not null default now()
);

create index if not exists uob_virtual_run_test_km_idx
  on public.uob_virtual_run_test (distance_km desc);

alter table public.uob_virtual_run_test enable row level security;

drop policy if exists vrtest_anon_insert on public.uob_virtual_run_test;
create policy vrtest_anon_insert on public.uob_virtual_run_test
  for insert to anon, authenticated with check (true);

drop policy if exists vrtest_anon_select on public.uob_virtual_run_test;
create policy vrtest_anon_select on public.uob_virtual_run_test
  for select to anon, authenticated using (true);

-- (Foto bukti memakai bucket 'vr-proofs' yang sama dengan produksi — cukup throwaway.)

-- Bersihkan data testing kapan saja:
--   delete from public.uob_virtual_run_test;
