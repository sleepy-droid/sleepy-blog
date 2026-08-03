-- =============================================================================
-- sleepy-blog · Schema Auth + Profiles + Comments + RLS
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================
-- Qué hace este script:
--  1. Tabla profiles (1 fila por usuario de auth.users)
--  2. Trigger que crea el perfil al registrarse
--  3. Tabla comments (comentarios en posts)
--  4. Función is_admin() para políticas RLS
--  5. Row Level Security en profiles, posts y comments
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PROFILES
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil público ligado a auth.users. role solo se cambia por SQL/admin.';

-- Auto-crear perfil cuando alguien se registra en Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'user' -- NUNCA confiar en metadata para asignar admin
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. COMMENTS
-- -----------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comments_post_id_idx on public.comments (post_id);
create index if not exists comments_user_id_idx on public.comments (user_id);
create index if not exists comments_created_at_idx on public.comments (created_at desc);

comment on table public.comments is 'Comentarios de usuarios autenticados sobre posts de la bitácora.';

-- -----------------------------------------------------------------------------
-- 3. HELPER is_admin()
-- security definer: lee profiles con privilegios de la función, no del caller
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY — profiles
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

-- Lectura pública del display_name para mostrar autores de comentarios
-- (select restringido a columnas vía vista opcional; por simplicidad permitimos
--  select de perfiles a autenticados y a anon solo si necesitas nombres públicos)
drop policy if exists "profiles_select_public_names" on public.profiles;
create policy "profiles_select_public_names"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Impide que el usuario se auto-promueva a admin
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- No hay policy de INSERT para clientes: solo el trigger (security definer) inserta

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY — posts
-- Lectura pública; escritura solo admin
-- -----------------------------------------------------------------------------
alter table public.posts enable row level security;

drop policy if exists "posts_select_public" on public.posts;
create policy "posts_select_public"
  on public.posts for select
  using (true);

drop policy if exists "posts_insert_admin" on public.posts;
create policy "posts_insert_admin"
  on public.posts for insert
  with check (public.is_admin());

drop policy if exists "posts_update_admin" on public.posts;
create policy "posts_update_admin"
  on public.posts for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "posts_delete_admin" on public.posts;
create policy "posts_delete_admin"
  on public.posts for delete
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY — comments
-- -----------------------------------------------------------------------------
alter table public.comments enable row level security;

drop policy if exists "comments_select_public" on public.comments;
create policy "comments_select_public"
  on public.comments for select
  using (true);

drop policy if exists "comments_insert_authenticated" on public.comments;
create policy "comments_insert_authenticated"
  on public.comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "comments_update_owner_or_admin" on public.comments;
create policy "comments_update_owner_or_admin"
  on public.comments for update
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "comments_delete_owner_or_admin" on public.comments;
create policy "comments_delete_owner_or_admin"
  on public.comments for delete
  using (auth.uid() = user_id or public.is_admin());

-- -----------------------------------------------------------------------------
-- 7. PROMOVER ADMIN (ejecutar DESPUÉS de registrarte en la web)
-- Reemplaza el email por el tuyo:
-- -----------------------------------------------------------------------------
-- update public.profiles
-- set role = 'admin'
-- where email = 'tu-email@ejemplo.com';
