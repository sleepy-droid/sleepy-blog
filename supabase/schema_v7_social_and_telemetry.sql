-- =============================================================================
-- sleepy-blog v1.1 · Schema v7 — Social Polish, Telemetry Vault & RED Plus Ledger
-- Ejecutar en Supabase SQL Editor DESPUÉS de schema_v6_storage_and_cdn.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. APPEND-ONLY TELEMETRY VAULT (analytics_events)
--    Registra cada reproducción, vista, voto, comentario, compartido y descarga
--    con partición lógica por `billing_period` ('YYYY-MM') para PowerBI.
-- -----------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null, -- 'song_play', 'product_view', 'vote_cast', 'comment_created', 'share_click', 'download_master'
  target_type text,         -- 'post', 'product', 'forum_thread', 'comment'
  target_id text,
  user_id uuid references auth.users (id) on delete set null,
  billing_period text not null default to_char(now() at time zone 'UTC', 'YYYY-MM'),
  country text default 'PA',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_period_idx on public.analytics_events (billing_period, event_type);
create index if not exists analytics_events_target_idx on public.analytics_events (target_type, target_id);

alter table public.analytics_events enable row level security;

-- Cualquier visitante o servidor puede insertar eventos de telemetría (append-only)
drop policy if exists "analytics_insert_all" on public.analytics_events;
create policy "analytics_insert_all"
  on public.analytics_events for insert
  with check (true);

-- Solo Administradores pueden consultar los eventos crudos
drop policy if exists "analytics_select_admin" on public.analytics_events;
create policy "analytics_select_admin"
  on public.analytics_events for select
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 2. RED RECORDINGS PLUS — PERMANENT MONTH ENTITLEMENT LEDGER
--    Registra qué meses ('YYYY-MM') fueron pagados por el cliente para acceso
--    permanente, o si cuenta con el nivel 'all_time_premium'.
-- -----------------------------------------------------------------------------
create table if not exists public.analytics_subscriptions (
  id uuid primary key default gen_random_uuid(),
  billing_period text not null unique, -- Ej: '2026-10', '2026-11', o 'ALL' para Premium Total
  tier text not null default 'monthly_permanent'
    check (tier in ('monthly_permanent', 'all_time_premium')),
  is_active boolean not null default true,
  unlocked_at timestamptz not null default now(),
  notes text
);

alter table public.analytics_subscriptions enable row level security;

drop policy if exists "analytics_subs_admin_all" on public.analytics_subscriptions;
create policy "analytics_subs_admin_all"
  on public.analytics_subscriptions for all
  using (public.is_admin())
  with check (public.is_admin());

-- Desbloquear por defecto el mes actual para el creador en su instancia principal
insert into public.analytics_subscriptions (billing_period, tier, notes)
values (to_char(now() at time zone 'UTC', 'YYYY-MM'), 'monthly_permanent', 'Mes inaugural v1.1 desbloqueado permanentemente')
on conflict (billing_period) do nothing;

-- -----------------------------------------------------------------------------
-- 3. VISTA LISTA PARA POWER BI (Filtra por meses permanentemente desbloqueados)
-- -----------------------------------------------------------------------------
create or replace view public.v_powerbi_analytics as
select
  e.id,
  e.event_type,
  e.target_type,
  e.target_id,
  e.user_id,
  e.billing_period,
  e.country,
  e.metadata,
  e.created_at
from public.analytics_events e
where exists (
  select 1
  from public.analytics_subscriptions s
  where s.is_active = true
    and (s.billing_period = e.billing_period or s.tier = 'all_time_premium' or s.billing_period = 'ALL')
);
