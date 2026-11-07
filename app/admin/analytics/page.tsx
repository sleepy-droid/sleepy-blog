import { buildBusinessIntelligenceSnapshot } from '@/lib/bi-engine'
import { BiDashboardClient } from './BiDashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsBiPage() {
  const snapshot = await buildBusinessIntelligenceSnapshot()

  return <BiDashboardClient snapshot={snapshot} />
}

