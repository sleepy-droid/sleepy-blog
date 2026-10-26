import { createClient } from '@/utils/supabase/server'

export type TelemetryEventType =
  | 'song_play'
  | 'product_view'
  | 'vote_cast'
  | 'comment_created'
  | 'share_click'
  | 'download_master'

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
    const billingPeriod = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

    await supabase.from('analytics_events').insert({
      event_type: params.eventType,
      target_type: params.targetType || null,
      target_id: params.targetId || null,
      user_id: params.userId || null,
      billing_period: billingPeriod,
      country: params.country || 'PA',
      metadata: params.metadata || {},
    })
  } catch {
    // Nunca interrumpir la experiencia del usuario si la tabla de telemetría aún no fue migrada
  }
}
