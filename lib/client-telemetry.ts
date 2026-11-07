'use client'

import type { TelemetryEventType } from '@/lib/telemetry'

const SESSION_STORAGE_KEY = 'sleepy_bi_session_id_v1'

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server'
  try {
    let sid = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (!sid) {
      sid =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      window.localStorage.setItem(SESSION_STORAGE_KEY, sid)
    }
    return sid
  } catch {
    return 'anon'
  }
}

export function trackClientEvent(params: {
  eventType: TelemetryEventType
  targetType?: string
  targetId?: string
  metadata?: Record<string, unknown>
}) {
  if (typeof window === 'undefined') return
  const sessionId = getOrCreateSessionId()

  fetch('/api/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({
      eventType: params.eventType,
      targetType: params.targetType || 'product',
      targetId: params.targetId || null,
      metadata: {
        session_id: sessionId,
        path: window.location.pathname,
        referrer: document.referrer || 'direct',
        ...(params.metadata || {}),
      },
    }),
  }).catch(() => {})
}

