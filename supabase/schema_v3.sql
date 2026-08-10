-- =============================================================================
-- sleepy-blog · Schema v3 — Orders, Cart, Votes, Extended Media & Forum Tags
-- Ejecutar DESPUÉS de schema_v2.sql en Supabase SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. EXTEND PRODUCTS & FORUM THREADS TABLES
-- -----------------------------------------------------------------------------
alter table public.products
  add column if not exists video_url text,
  add column if not exists acapella_url text,
  add column if not exists instrumental_url text,
  add column if not exists wav_url text,
  add column if not exists mp3_url text,
  add column if not exists upvotes integer not null default 0,
  add column if not exists downvotes integer not null default 0;

alter table public.posts
  add column if not exists upvotes integer not null default 0,
  add column if not exists downvotes integer not null default 0;

alter table public.forum_threads
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists upvotes integer not null default 0,
  add column if not exists downvotes integer not null default 0;

alter table public.comments
  add column if not exists upvotes integer not null default 0,
  add column if not exists downvotes integer not null default 0;

-- -----------------------------------------------------------------------------
-- 2. ORDERS & ORDER ITEMS
-- -----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'processing' 
    check (status in ('processing', 'shipped', 'delivered', 'completed', 'cancelled')),
  total_cents integer not null default 0 check (total_cents >= 0),
  currency text not null default 'USD',
  shipping_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_label text,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_cents integer not null default 0 check (unit_price_cents >= 0),
  created_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- -----------------------------------------------------------------------------
-- 3. CART ITEMS
-- -----------------------------------------------------------------------------
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_label text,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id, variant_label)
);

create index if not exists cart_items_user_idx on public.cart_items (user_id);

-- -----------------------------------------------------------------------------
-- 4. VOTES (Upvotes / Downvotes System)
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

-- -----------------------------------------------------------------------------
-- 5. RLS POLICIES FOR ORDERS, CART, AND VOTES
-- -----------------------------------------------------------------------------
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cart_items enable row level security;
alter table public.votes enable row level security;

-- Orders
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
  on public.orders for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

-- Order Items
drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- Cart Items
drop policy if exists "cart_select_own" on public.cart_items;
create policy "cart_select_own"
  on public.cart_items for select
  using (auth.uid() = user_id);

drop policy if exists "cart_manage_own" on public.cart_items;
create policy "cart_manage_own"
  on public.cart_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Votes
drop policy if exists "votes_select_public" on public.votes;
create policy "votes_select_public"
  on public.votes for select
  using (true);

drop policy if exists "votes_manage_own" on public.votes;
create policy "votes_manage_own"
  on public.votes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
