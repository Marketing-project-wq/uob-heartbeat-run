-- ============================================================
-- VIRTUAL RUN UOB — tabel submission sekali jalan + foto bukti
-- Road to UOB Heartbeat Run × 20FIT
-- Jalankan di Supabase → SQL Editor → New query → Run.
-- Aman dijalankan ulang (idempotent).
-- ============================================================

-- 1) Tabel submission
create table if not exists public.uob_virtual_run (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  email        text,
  phone        text,
  nik          text not null unique,        -- 1 submission per NIK
  kcp          text,
  distance_km  numeric not null check (distance_km >= 0),
  created_at   timestamptz not null default now()
);

-- 1b) Kolom foto bukti (WAJIB diisi user lewat halaman virtual run)
alter table public.uob_virtual_run add column if not exists proof_url text;

create index if not exists uob_virtual_run_km_idx
  on public.uob_virtual_run (distance_km desc);

-- 2) RLS tabel: anon boleh INSERT (sekali, via unique nik) + SELECT
alter table public.uob_virtual_run enable row level security;

drop policy if exists vr_anon_insert on public.uob_virtual_run;
create policy vr_anon_insert on public.uob_virtual_run
  for insert to anon, authenticated with check (true);

drop policy if exists vr_anon_select on public.uob_virtual_run;
create policy vr_anon_select on public.uob_virtual_run
  for select to anon, authenticated using (true);

-- 3) STORAGE: bucket publik untuk foto bukti lari
insert into storage.buckets (id, name, public)
values ('vr-proofs', 'vr-proofs', true)
on conflict (id) do update set public = true;

-- anon boleh upload + baca di bucket vr-proofs
drop policy if exists vr_proofs_insert on storage.objects;
create policy vr_proofs_insert on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'vr-proofs');

drop policy if exists vr_proofs_select on storage.objects;
create policy vr_proofs_select on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'vr-proofs');

-- (Tidak ada UPDATE/DELETE → data & foto tidak bisa diubah setelah submit)
