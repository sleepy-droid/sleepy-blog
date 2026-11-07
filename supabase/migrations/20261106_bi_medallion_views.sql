-- ============================================================================
-- SLEEPY-BLOG: ARQUITECTURA DE INTELIGENCIA DE NEGOCIOS (MEDALLION BI STACK)
-- Capas:
--   1. Bronze (Raw Telemetry): public.analytics_events + tablas operacionales
--   2. Silver (Classified & Normalized): v_bi_silver_classified_events
--   3. Gold (BI Models):
--      - v_bi_gold_product_funnel (Stream -> View -> Cart -> Purchase -> Download)
--      - v_bi_gold_rfm_user_segments (Recency, Frequency, Monetary Fan Scoring)
--      - v_bi_gold_stem_affinity (Master WAV vs MP3 vs Acapella vs Instrumental vs Poster 3000x3000)
-- ============================================================================

-- 1. Índices de aceleración analítica sobre analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type_created
  ON public.analytics_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_target_id
  ON public.analytics_events (target_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id
  ON public.analytics_events (user_id);

-- 2. CAPA SILVER: Eventos Clasificados por Pilar de Dominio, Dispositivo y Sesión
CREATE OR REPLACE VIEW public.v_bi_silver_classified_events AS
SELECT
  ae.id,
  ae.event_type,
  CASE
    WHEN ae.event_type IN ('song_play', 'song_complete', 'stem_switch', 'pip_opened', 'queue_reorder')
      THEN 'ENGAGEMENT_AUDIO'
    WHEN ae.event_type IN ('product_view', 'cart_add', 'checkout_started', 'purchase_completed', 'download_master')
      THEN 'MONETIZATION'
    WHEN ae.event_type IN ('vote_cast', 'comment_created', 'forum_thread_created')
      THEN 'COMMUNITY_SOCIAL'
    ELSE 'RETENTION_IDENTITY'
  END AS domain_pillar,
  ae.target_type,
  ae.target_id,
  ae.user_id,
  ae.billing_period,
  COALESCE(NULLIF(ae.country, ''), 'PA') AS country,
  COALESCE(ae.metadata->>'device', 'Desktop') AS device,
  COALESCE(ae.metadata->>'stem', ae.metadata->>'asset', 'master') AS asset_or_stem,
  COALESCE((ae.metadata->>'amount_cents'):: integer, 0) AS amount_cents,
  ae.metadata,
  ae.created_at
FROM public.analytics_events ae;

-- 3. CAPA GOLD — MODELO 1: Embudo de Conversión por Producto (Stream-to-Collector Funnel)
CREATE OR REPLACE VIEW public.v_bi_gold_product_funnel AS
SELECT
  p.id AS product_id,
  p.slug,
  p.name,
  p.category,
  p.price_cents,
  COALESCE(p.upvotes, 0) AS upvotes,
  COALESCE(p.downvotes, 0) AS downvotes,
  COUNT(DISTINCT ae.id) FILTER (WHERE ae.event_type = 'song_play') AS total_streams,
  COUNT(DISTINCT ae.id) FILTER (WHERE ae.event_type = 'product_view') AS product_views,
  COUNT(DISTINCT ae.id) FILTER (WHERE ae.event_type IN ('cart_add', 'checkout_started')) AS cart_adds,
  COUNT(DISTINCT li.user_id) AS unique_collectors,
  COUNT(DISTINCT ae.id) FILTER (WHERE ae.event_type = 'download_master') AS master_downloads,
  COALESCE(COUNT(DISTINCT li.user_id) * p.price_cents, 0) AS estimated_revenue_cents,
  ROUND(
    (COUNT(DISTINCT li.user_id)::numeric / NULLIF(COUNT(DISTINCT ae.id) FILTER (WHERE ae.event_type = 'song_play'), 0)) * 100,
    2
  ) AS stream_to_buy_pct
FROM public.products p
LEFT JOIN public.analytics_events ae
  ON ae.target_id = p.id::text OR ae.target_id = p.slug
LEFT JOIN public.library_items li
  ON li.product_id = p.id
GROUP BY p.id, p.slug, p.name, p.category, p.price_cents, p.upvotes, p.downvotes;

-- 4. CAPA GOLD — MODELO 2: Segmentación RFM de Fans y Coleccionistas
CREATE OR REPLACE VIEW public.v_bi_gold_rfm_user_segments AS
WITH user_metrics AS (
  SELECT
    pr.id AS user_id,
    COALESCE(pr.display_name, pr.username, pr.email, 'Fan Anónimo') AS fan_name,
    pr.username,
    pr.role,
    COUNT(DISTINCT li.product_id) AS unlocked_items_count,
    COALESCE(SUM(o.total_cents) FILTER (WHERE o.status IN ('paid', 'completed')), 0) AS monetary_cents,
    COUNT(DISTINCT ae.id) FILTER (WHERE ae.event_type = 'song_play') AS stream_count,
    COUNT(DISTINCT ae.id) FILTER (WHERE ae.event_type = 'stem_switch') AS stem_switches,
    GREATEST(
      pr.updated_at,
      MAX(ae.created_at),
      MAX(li.created_at),
      pr.created_at
    ) AS last_active_at
  FROM public.profiles pr
  LEFT JOIN public.library_items li ON li.user_id = pr.id
  LEFT JOIN public.orders o ON o.user_id = pr.id
  LEFT JOIN public.analytics_events ae ON ae.user_id = pr.id
  GROUP BY pr.id, pr.display_name, pr.username, pr.email, pr.role, pr.updated_at, pr.created_at
)
SELECT
  um.*,
  EXTRACT(DAY FROM (NOW() - COALESCE(um.last_active_at, NOW())))::integer AS recency_days,
  CASE
    WHEN um.monetary_cents >= 1500 OR um.unlocked_items_count >= 3 THEN '🐋 Coleccionista VIP'
    WHEN um.stem_switches >= 2 THEN '🎛️ Productor / Stems'
    WHEN um.unlocked_items_count >= 1 OR um.stream_count >= 5 THEN '🔥 Superfan Activo'
    WHEN EXTRACT(DAY FROM (NOW() - COALESCE(um.last_active_at, NOW()))) <= 30 THEN '🎧 Oyente Casual'
    ELSE '💤 En Riesgo'
  END AS rfm_segment
FROM user_metrics um;

-- 5. CAPA GOLD — MODELO 3: Afinidad de Stems, Formatos y Pósters 3000x3000
CREATE OR REPLACE VIEW public.v_bi_gold_stem_affinity AS
SELECT
  COALESCE(ae.metadata->>'stem', ae.metadata->>'asset', 'master') AS asset_type,
  ae.event_type,
  COUNT(*) AS total_interactions,
  COUNT(DISTINCT ae.user_id) AS unique_users
FROM public.analytics_events ae
WHERE ae.event_type IN ('song_play', 'stem_switch', 'download_master')
GROUP BY COALESCE(ae.metadata->>'stem', ae.metadata->>'asset', 'master'), ae.event_type;

-- 6. CORRECCIÓN DE POLÍTICA RLS Y ESTADÍSTICAS HONESTAS EN EL FORO
DROP POLICY IF EXISTS "forum_threads_delete_own_or_admin" ON public.forum_threads;
CREATE POLICY "forum_threads_delete_own_or_admin"
  ON public.forum_threads FOR DELETE
  USING (auth.uid() = author_id OR public.is_admin());

-- Sincronizar conteo real de votos en forum_threads desde public.votes (elimina el placeholder de 1 like)
UPDATE public.forum_threads ft
SET
  upvotes = COALESCE((
    SELECT COUNT(*) FROM public.votes v
    WHERE v.target_type = 'forum_thread' AND v.target_id = ft.id AND v.vote_value = 1
  ), 0),
  downvotes = COALESCE((
    SELECT COUNT(*) FROM public.votes v
    WHERE v.target_type = 'forum_thread' AND v.target_id = ft.id AND v.vote_value = -1
  ), 0);


