-- =============================================================================
-- sleepy-blog · Schema v5 — Custom Post Tags, Product Links, Status & Vote Tables
-- Ejecutar en Supabase SQL Editor DESPUÉS de schema_v4.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTEND POSTS TABLE (Highlight Tag, Linked Product & Status Visibility)
-- -----------------------------------------------------------------------------
alter table public.posts
  add column if not exists highlight_tag text default 'Lanzamiento',
  add column if not exists linked_product_id uuid references public.products (id) on delete set null,
  add column if not exists status text default 'visible' check (status in ('visible', 'hidden', 'archived'));

-- -----------------------------------------------------------------------------
-- 2. ENSURE VOTES TABLE FOR REAL USER VOTES (LIKE / DISLIKE)
-- -----------------------------------------------------------------------------
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'product', 'forum_thread', 'comment')),
  target_id uuid not null,
  vote_value integer not null check (vote_value in (1, -1)),
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index if not exists votes_target_idx on public.votes (target_type, target_id);
create index if not exists votes_user_idx on public.votes (user_id);

-- RLS Policies for Votes
alter table public.votes enable row level security;

drop policy if exists "votes_select_public" on public.votes;
create policy "votes_select_public"
  on public.votes for select
  using (true);

drop policy if exists "votes_manage_own" on public.votes;
create policy "votes_manage_own"
  on public.votes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. ENSURE COMMENTS TARGETING BOTH POSTS AND PRODUCTS
-- -----------------------------------------------------------------------------
alter table public.comments
  add column if not exists target_type text default 'post' check (target_type in ('post', 'product', 'forum_thread', 'profile_update')),
  add column if not exists target_id uuid;

create index if not exists comments_target_idx on public.comments (target_type, target_id);
