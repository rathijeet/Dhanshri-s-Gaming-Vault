-- ============================================================
-- Storage policies for the `apparel-images` bucket.
-- Run this AFTER 001_apparels.sql and AFTER creating the
-- `apparel-images` bucket in Supabase Storage.
--
-- Fixes: "new row violates row-level security policy"
-- when uploading product images from the admin panel.
-- ============================================================

-- Public READ (anyone can view product images via the public URL)
drop policy if exists "apparel-images public read" on storage.objects;
create policy "apparel-images public read"
  on storage.objects for select
  using ( bucket_id = 'apparel-images' );

-- Authenticated INSERT (admin can upload)
drop policy if exists "apparel-images admin insert" on storage.objects;
create policy "apparel-images admin insert"
  on storage.objects for insert
  with check (
    bucket_id = 'apparel-images'
    and auth.role() = 'authenticated'
  );

-- Authenticated UPDATE (rename / replace)
drop policy if exists "apparel-images admin update" on storage.objects;
create policy "apparel-images admin update"
  on storage.objects for update
  using (
    bucket_id = 'apparel-images'
    and auth.role() = 'authenticated'
  )
  with check (
    bucket_id = 'apparel-images'
    and auth.role() = 'authenticated'
  );

-- Authenticated DELETE (admin can remove an image)
drop policy if exists "apparel-images admin delete" on storage.objects;
create policy "apparel-images admin delete"
  on storage.objects for delete
  using (
    bucket_id = 'apparel-images'
    and auth.role() = 'authenticated'
  );
