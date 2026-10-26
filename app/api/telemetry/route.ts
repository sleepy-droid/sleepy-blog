import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { recordTelemetryEvent, type TelemetryEventType } from '@/lib/telemetry'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const eventType = String(body.eventType || 'song_play') as TelemetryEventType
    const targetType = body.targetType ? String(body.targetType) : null
    const targetId = body.targetId ? String(body.targetId) : null
    const metadata = typeof body.metadata === 'object' && body.metadata ? body.metadata : {}

    const user = await getCurrentUser()
    const country = request.headers.get('x-vercel-ip-country') || 'PA'

    await recordTelemetryEvent({
      eventType,
      targetType,
      targetId,
      userId: user?.id || null,
      country,
      metadata,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
