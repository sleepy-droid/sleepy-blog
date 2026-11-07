import { createClient } from '@/utils/supabase/server'

export type TelemetryEventType =
  | 'song_play'
  | 'song_complete'
  | 'stem_switch'
  | 'pip_opened'
  | 'queue_reorder'
  | 'product_view'
  | 'cart_add'
  | 'checkout_started'
  | 'purchase_completed'
  | 'download_master'
  | 'vote_cast'
  | 'comment_created'
  | 'forum_thread_created'
  | 'profile_customized'
  | 'share_click'

export type TelemetryDomainPillar =
  | 'ENGAGEMENT_AUDIO'
  | 'MONETIZATION'
  | 'COMMUNITY_SOCIAL'
  | 'RETENTION_IDENTITY'

/**
 * Classifies any raw telemetry event into one of the 4 Business Intelligence Domain Pillars.
 */
export function classifyEventDomainPillar(
  eventType: string
): TelemetryDomainPillar {
  switch (eventType) {
    case 'song_play':
    case 'song_complete':
    case 'stem_switch':
    case 'pip_opened':
    case 'queue_reorder':
      return 'ENGAGEMENT_AUDIO'
    case 'product_view':
    case 'cart_add':
    case 'checkout_started':
    case 'purchase_completed':
    case 'download_master':
      return 'MONETIZATION'
    case 'vote_cast':
    case 'comment_created':
    case 'forum_thread_created':
    case 'share_click':
      return 'COMMUNITY_SOCIAL'
    case 'profile_customized':
    default:
      return 'RETENTION_IDENTITY'
  }
}

export function detectDeviceCategory(userAgent?: string | null): 'iOS' | 'Android' | 'Desktop' {
  if (!userAgent) return 'Desktop'
  const ua = userAgent.toLowerCase()
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return 'iOS'
  }
  if (ua.includes('android')) {
    return 'Android'
  }
  return 'Desktop'
}

export async function recordTelemetryEvent(params: {
  eventType: TelemetryEventType
  targetType?: string | null
  targetId?: string | null
  userId?: string | null
  country?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    const supabase = await createClient()
    const now = new Date()
    const billingPeriod = `${now.getUTCFullYear()}-${String(
      now.getUTCMonth() + 1
    ).padStart(2, '0')}`
    const domainPillar = classifyEventDomainPillar(params.eventType)

    await supabase.from('analytics_events').insert({
      event_type: params.eventType,
      target_type: params.targetType || null,
      target_id: params.targetId || null,
      user_id: params.userId || null,
      billing_period: billingPeriod,
      country: params.country || 'PA',
      metadata: {
        domain_pillar: domainPillar,
        recorded_at_iso: now.toISOString(),
        ...(params.metadata || {}),
      },
    })
  } catch {
    // Nunca interrumpir la experiencia del usuario si la tabla de telemetría aún no fue migrada
  }
}
