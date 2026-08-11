-- =============================================================================
-- sleepy-blog · Schema v4 — Phase 3 Migrations & Enhancements
-- Ejecutar en Supabase SQL Editor DESPUÉS de schema_v3.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTEND PROFILES TABLE (Birthday, Gender, Status Update & Comment Moderation)
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists birthday date,
  add column if not exists gender text default 'unspecified' check (gender in ('male', 'female', 'gender_neutral', 'unspecified')),
  add column if not exists status_update text,
  add column if not exists can_comment boolean not null default true;

-- -----------------------------------------------------------------------------
-- 2. EXTEND POSTS TABLE (Image URL Fallback & Like Count)
-- -----------------------------------------------------------------------------
alter table public.posts
  add column if not exists image_url text,
  add column if not exists cover_url text,
  add column if not exists like_count integer not null default 0;

-- -----------------------------------------------------------------------------
-- 3. EXTEND FORUM THREADS TABLE (Multiple Tagged Products & Moderation Status)
-- -----------------------------------------------------------------------------
alter table public.forum_threads
  add column if not exists product_ids text[] not null default '{}'::text[],
  add column if not exists status text not null default 'visible' check (status in ('visible', 'hidden', 'deleted'));

-- -----------------------------------------------------------------------------
-- 4. FIX COMMENTS TABLE (Polymorphic Comments on Products & Forum Threads)
-- -----------------------------------------------------------------------------
-- Make post_id optional to allow comments on products or forum threads
alter table public.comments
  alter column post_id drop not null;

-- Drop rigid FK constraint if post_id is null or targeting a product/thread
alter table public.comments
  drop constraint if exists comments_post_id_fkey;

alter table public.comments
  add column if not exists target_type text default 'post' check (target_type in ('post', 'product', 'forum_thread', 'profile_update')),
  add column if not exists target_id uuid;

-- -----------------------------------------------------------------------------
-- 5. EXTEND ORDERS TABLE (Billing Info Column)
-- -----------------------------------------------------------------------------
alter table public.orders
  add column if not exists billing_info text;
