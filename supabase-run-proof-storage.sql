-- ============================================================
--  RUN PROOF STORAGE + VALIDATION COLUMNS
--  Road to UOB Heartbeat Run × 20FIT
--  ------------------------------------------------------------
--  Run once in Supabase → SQL Editor. Lets the app save each run's
--  proof photo + validation status so the team can validate later.
-- ============================================================

-- 1) Validation columns on the activities table
alter table uob_activities add column if not exists photo_url    text;    -- URL foto bukti lari (WAJIB tersimpan untuk verifikasi)
alter table uob_activities add column if not exists proof_valid  boolean;
alter table uob_activities add column if not exists proof_status text;   -- 'auto_verified' | 'needs_review'

-- 2) Storage bucket for proof photos (public so the team can open the URL)
insert into storage.buckets (id, name, public)
values ('run-proofs', 'run-proofs', true)
on conflict (id) do nothing;

-- 3) Policies on the bucket
drop policy if exists "run-proofs upload own" on storage.objects;
create policy "run-proofs upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'run-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "run-proofs read" on storage.objects;
create policy "run-proofs read" on storage.objects
  for select to public
  using (bucket_id = 'run-proofs');

-- Done. New manual runs will store distance + photo_url + proof_valid/status.
-- To review entries:
--   select recorded_at, user_id, distance_km, proof_valid, proof_status, photo_url
--   from uob_activities order by recorded_at desc;
