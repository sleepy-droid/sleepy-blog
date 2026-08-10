-- =============================================================================
-- sleepy-blog · Schema v2 — Products, Library, Profiles+, Moderation, Forum
-- Ejecutar DESPUÉS de schema.sql en Supabase SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PROFILES — MySpace fields
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists username text,
  add column if not exists bio text,
  add column if not exists banner_url text,
  add column if not exists favorite_product_id uuid,
  add column if not exists is_public boolean not null default true;

-- Unique username (nullable until user sets it)
create unique index if not exists profiles_username_unique
  on public.profiles (lower(username))
  where username is not null;

-- Backfill username from display_name / email for existing rows
update public.profiles
set username = lower(regexp_replace(
  coalesce(nullif(display_name, ''), split_part(coalesce(email, 'user'), '@', 1)),
  '[^a-zA-Z0-9_]',
  '',
  'g'
))
where username is null;

-- Update trigger: also set username on signup if missing
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
  uname text;
begin
  base_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(new.email, '@', 1)
  );
  uname := lower(regexp_replace(base_name, '[^a-zA-Z0-9_]', '', 'g'));
  if uname is null or uname = '' then
    uname := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into public.profiles (id, email, display_name, username, role)
  values (new.id, new.email, base_name, uname, 'user')
  on conflict (id) do nothing;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. PRODUCTS
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  fulfillment text not null check (fulfillment in ('digital', 'physical')),
  category text not null check (category in ('music', 'merch', 'poster', 'bundle', 'other')),
  thumbnail_url text,
  gallery jsonb not null default '[]'::jsonb,
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'USD',
  stock integer,
  is_published boolean not null default true,
  is_featured boolean not null default false,
  audio_preview_url text,
  duration_seconds integer,
  specs jsonb not null default '{}'::jsonb,
  popularity_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_fulfillment_idx on public.products (fulfillment);
create index if not exists products_published_idx on public.products (is_published);
create index if not exists products_popularity_idx on public.products (popularity_score desc);

-- favorite_product FK (added after products exists)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'profiles_favorite_product_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_favorite_product_id_fkey
      foreign key (favorite_product_id) references public.products (id) on delete set null;
  end if;
end $$;

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text,
  label text not null,
  price_cents integer,
  stock integer,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists product_variants_product_id_idx on public.product_variants (product_id);

create table if not exists public.product_assets (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  kind text not null check (kind in ('mp3', 'wav', 'pdf', 'image', 'other')),
  storage_path text not null,
  label text,
  requires_membership boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_assets_product_id_idx on public.product_assets (product_id);

-- -----------------------------------------------------------------------------
-- 3. LIBRARY + MEMBERSHIPS
-- -----------------------------------------------------------------------------
create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  source text not null default 'admin_grant'
    check (source in ('purchase', 'admin_grant', 'membership', 'gift')),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists library_items_user_id_idx on public.library_items (user_id);

create table if not exists public.memberships (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'none' check (plan in ('none', 'monthly', 'yearly')),
  active_until timestamptz,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 4. COMMENTS — soft moderation + polymorphic target (keep post_id for compat)
-- -----------------------------------------------------------------------------
alter table public.comments
  add column if not exists target_type text,
  add column if not exists target_id uuid,
  add column if not exists status text,
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_by uuid references auth.users (id) on delete set null;

-- Defaults + backfill from post_id
update public.comments
set
  target_type = coalesce(target_type, 'post'),
  target_id = coalesce(target_id, post_id),
  status = coalesce(status, 'visible')
where true;

alter table public.comments
  alter column target_type set default 'post',
  alter column status set default 'visible';

-- Relax post_id to nullable for future product comments (if column exists)
do $$
begin
  alter table public.comments alter column post_id drop not null;
exception when others then
  null;
end $$;

do $$
begin
  alter table public.comments
    drop constraint if exists comments_status_check;
  alter table public.comments
    add constraint comments_status_check
    check (status in ('visible', 'hidden', 'deleted'));
exception when others then
  null;
end $$;

do $$
begin
  alter table public.comments
    drop constraint if exists comments_target_type_check;
  alter table public.comments
    add constraint comments_target_type_check
    check (target_type in ('post', 'product', 'forum_thread', 'profile_update'));
exception when others then
  null;
end $$;

create index if not exists comments_target_idx on public.comments (target_type, target_id);
create index if not exists comments_status_idx on public.comments (status);

-- Public can only see visible comments (replace old select policy)
drop policy if exists "comments_select_public" on public.comments;
create policy "comments_select_public"
  on public.comments for select
  using (
    status = 'visible'
    or auth.uid() = user_id
    or public.is_admin()
  );

-- -----------------------------------------------------------------------------
-- 5. POSTS — featured / popularity helpers (additive, safe if columns missing)
-- -----------------------------------------------------------------------------
alter table public.posts
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_published boolean not null default true,
  add column if not exists view_count integer not null default 0,
  add column if not exists like_count integer not null default 0,
  add column if not exists status text default 'published';

update public.posts set status = coalesce(status, 'published') where true;

-- -----------------------------------------------------------------------------
-- 6. FORUM
-- -----------------------------------------------------------------------------
create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null default '',
  image_url text,
  linked_product_id uuid references public.products (id) on delete set null,
  youtube_url text,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'deleted')),
  created_at timestamptz not null default now()
);

create index if not exists forum_threads_created_idx on public.forum_threads (created_at desc);
create index if not exists forum_replies_thread_idx on public.forum_replies (thread_id);

-- -----------------------------------------------------------------------------
-- 7. PROFILE UPDATES (status feed)
-- -----------------------------------------------------------------------------
create table if not exists public.profile_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  image_url text,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'deleted')),
  created_at timestamptz not null default now()
);

create index if not exists profile_updates_user_idx on public.profile_updates (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 8. SITE SETTINGS
-- -----------------------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value) values
  ('social_instagram', '#'),
  ('social_x', '#'),
  ('social_discord', '#'),
  ('site_tagline', 'Bitácora oficial, diario & lanzamientos directos')
on conflict (key) do nothing;

-- -----------------------------------------------------------------------------
-- 9. RLS — products
-- -----------------------------------------------------------------------------
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_assets enable row level security;

drop policy if exists "products_select_published" on public.products;
create policy "products_select_published"
  on public.products for select
  using (is_published = true or public.is_admin());

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "product_variants_select" on public.product_variants;
create policy "product_variants_select"
  on public.product_variants for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and (p.is_published or public.is_admin())
    )
  );

drop policy if exists "product_variants_admin" on public.product_variants;
create policy "product_variants_admin"
  on public.product_variants for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "product_assets_select_admin" on public.product_assets;
create policy "product_assets_select_admin"
  on public.product_assets for select
  using (public.is_admin());

-- Owners can see asset metadata for products they own (download paths still need signed URLs)
drop policy if exists "product_assets_select_owner" on public.product_assets;
create policy "product_assets_select_owner"
  on public.product_assets for select
  using (
    exists (
      select 1 from public.library_items li
      where li.product_id = product_assets.product_id
        and li.user_id = auth.uid()
    )
  );

drop policy if exists "product_assets_admin" on public.product_assets;
create policy "product_assets_admin"
  on public.product_assets for all
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 10. RLS — library + memberships
-- -----------------------------------------------------------------------------
alter table public.library_items enable row level security;
alter table public.memberships enable row level security;

drop policy if exists "library_select_own" on public.library_items;
create policy "library_select_own"
  on public.library_items for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "library_insert_own_or_admin" on public.library_items;
create policy "library_insert_own_or_admin"
  on public.library_items for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "library_admin_all" on public.library_items;
create policy "library_admin_all"
  on public.library_items for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "memberships_select_own" on public.memberships;
create policy "memberships_select_own"
  on public.memberships for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "memberships_admin" on public.memberships;
create policy "memberships_admin"
  on public.memberships for all
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 11. RLS — forum + profile_updates + settings
-- -----------------------------------------------------------------------------
alter table public.forum_threads enable row level security;
alter table public.forum_replies enable row level security;
alter table public.profile_updates enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "forum_threads_select" on public.forum_threads;
create policy "forum_threads_select"
  on public.forum_threads for select
  using (status = 'visible' or author_id = auth.uid() or public.is_admin());

drop policy if exists "forum_threads_insert" on public.forum_threads;
create policy "forum_threads_insert"
  on public.forum_threads for insert
  with check (auth.uid() = author_id);

drop policy if exists "forum_threads_update_own" on public.forum_threads;
create policy "forum_threads_update_own"
  on public.forum_threads for update
  using (auth.uid() = author_id or public.is_admin());

drop policy if exists "forum_replies_select" on public.forum_replies;
create policy "forum_replies_select"
  on public.forum_replies for select
  using (status = 'visible' or author_id = auth.uid() or public.is_admin());

drop policy if exists "forum_replies_insert" on public.forum_replies;
create policy "forum_replies_insert"
  on public.forum_replies for insert
  with check (auth.uid() = author_id);

drop policy if exists "forum_replies_update" on public.forum_replies;
create policy "forum_replies_update"
  on public.forum_replies for update
  using (auth.uid() = author_id or public.is_admin());

drop policy if exists "profile_updates_select" on public.profile_updates;
create policy "profile_updates_select"
  on public.profile_updates for select
  using (status = 'visible' or user_id = auth.uid() or public.is_admin());

drop policy if exists "profile_updates_insert" on public.profile_updates;
create policy "profile_updates_insert"
  on public.profile_updates for insert
  with check (auth.uid() = user_id);

drop policy if exists "profile_updates_update" on public.profile_updates;
create policy "profile_updates_update"
  on public.profile_updates for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "site_settings_select" on public.site_settings;
create policy "site_settings_select"
  on public.site_settings for select
  using (true);

drop policy if exists "site_settings_admin" on public.site_settings;
create policy "site_settings_admin"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- 12. SEED demo products (safe to re-run)
-- -----------------------------------------------------------------------------
insert into public.products (
  slug, name, description, fulfillment, category,
  thumbnail_url, price_cents, is_published, is_featured,
  audio_preview_url, popularity_score, specs
) values
(
  'criss-angel',
  'Criss Angel (Edición Digital)',
  'Lanzamiento digital exclusivo. Alta calidad para fans de sleepyred999. Incluye arte y acceso a biblioteca.',
  'digital',
  'music',
  '/images/releases/criss-angel.jpg',
  1200,
  true,
  true,
  null,
  100,
  '{}'::jsonb
),
(
  'sleepyred-hoodie-neon',
  'Sleepyred Neon Hoodie',
  'Buzo oversize negro con estampado neón reflectivo de la marca. Edición física oficial.',
  'physical',
  'merch',
  '/images/logos/SLEEPYRED JPG NEON-02.jpg',
  5500,
  true,
  true,
  null,
  40,
  '{"material":"Algodón pesado","fit":"Oversize","care":"Lavar en frío"}'::jsonb
),
(
  'poster-neon-01',
  'Póster Neon Logo',
  'Póster de alta calidad con el logotipo neón sleepyred999.',
  'physical',
  'poster',
  '/images/logos/PNG-04.png',
  1800,
  true,
  false,
  null,
  20,
  '{"size":"A2","finish":"Mate"}'::jsonb
)
on conflict (slug) do nothing;

insert into public.product_variants (product_id, label, stock)
select id, v.label, 25
from public.products p
cross join (values ('S'), ('M'), ('L'), ('XL')) as v(label)
where p.slug = 'sleepyred-hoodie-neon'
  and not exists (
    select 1 from public.product_variants pv where pv.product_id = p.id
  );
