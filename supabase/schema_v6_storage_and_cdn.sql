-- =============================================================================
-- sleepy-blog v1.0 · Schema v6 — Own CDN Storage Buckets, Vault RLS & Folder Path
-- Ejecutar en Supabase SQL Editor DESPUÉS de schema_v5.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTEND PRODUCTS TABLE WITH CANONICAL STORAGE FOLDER PATH
-- -----------------------------------------------------------------------------
alter table public.products
  add column if not exists storage_folder_path text,
  add column if not exists acapella_url text,
  add column if not exists instrumental_url text,
  add column if not exists video_url text,
  add column if not exists wav_url text,
  add column if not exists mp3_url text;

-- -----------------------------------------------------------------------------
-- 2. PROVISION SUPABASE STORAGE BUCKETS (PUBLIC CDN + PRIVATE MASTER VAULT)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('public-media', 'public-media', true, 104857600),   -- 100 MB limit per public preview/cover
  ('private-vault', 'private-vault', false, 262144000) -- 250 MB limit per master WAV/stem
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit;

-- -----------------------------------------------------------------------------
-- 3. STORAGE RLS POLICIES FOR PUBLIC-MEDIA & PRIVATE-VAULT
-- -----------------------------------------------------------------------------
drop policy if exists "public_media_read_all" on storage.objects;
create policy "public_media_read_all"
  on storage.objects for select
  using (bucket_id = 'public-media');

drop policy if exists "public_media_admin_write" on storage.objects;
create policy "public_media_admin_write"
  on storage.objects for all
  using (bucket_id = 'public-media' and public.is_admin())
  with check (bucket_id = 'public-media' and public.is_admin());

drop policy if exists "private_vault_admin_all" on storage.objects;
create policy "private_vault_admin_all"
  on storage.objects for all
  using (bucket_id = 'private-vault' and public.is_admin())
  with check (bucket_id = 'private-vault' and public.is_admin());

-- Allow authenticated owners (via library_items) to read/sign their purchased files
drop policy if exists "private_vault_owner_read" on storage.objects;
create policy "private_vault_owner_read"
  on storage.objects for select
  using (
    bucket_id = 'private-vault'
    and (
      public.is_admin()
      or exists (
        select 1
        from public.library_items li
        join public.products p on p.id = li.product_id
        where li.user_id = auth.uid()
          and (
            name like ('songs/' || p.slug || '/%')
            or (p.storage_folder_path is not null and name like (p.storage_folder_path || '/%'))
          )
      )
    )
  );
