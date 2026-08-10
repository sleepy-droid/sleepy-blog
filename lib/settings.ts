import { createClient } from '@/utils/supabase/server'
import type { SiteSettingsMap } from '@/lib/types'

const DEFAULTS: SiteSettingsMap = {
  social_instagram: '#',
  social_x: '#',
  social_discord: '#',
  site_tagline: 'Bitácora oficial, diario & lanzamientos directos',
}

export async function getSiteSettings(): Promise<SiteSettingsMap> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('site_settings').select('key, value')
    if (error || !data) return { ...DEFAULTS }

    const map = { ...DEFAULTS }
    for (const row of data) {
      map[row.key] = row.value
    }
    return map
  } catch {
    return { ...DEFAULTS }
  }
}
