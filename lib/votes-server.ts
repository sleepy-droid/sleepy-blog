import type { SupabaseClient } from '@supabase/supabase-js'
import type { VoteTargetType } from './types'

/**
 * Obtiene el mapa de votos reales del usuario autenticado para una lista de objetivos.
 * Garantiza que el estado "Me gusta" permanezca iluminado al navegar o recargar páginas.
 */
export async function getUserVotesMap(params: {
  supabase: SupabaseClient
  userId?: string | null
  targetType: VoteTargetType
  targetIds?: string[]
}): Promise<Record<string, 1 | -1>> {
  const { supabase, userId, targetType, targetIds } = params
  if (!userId) return {}

  try {
    let query = supabase
      .from('votes')
      .select('target_id, vote_value')
      .eq('user_id', userId)
      .eq('target_type', targetType)

    if (targetIds && targetIds.length > 0) {
      query = query.in('target_id', targetIds)
    }

    const { data, error } = await query
    if (error || !data) return {}

    const map: Record<string, 1 | -1> = {}
    for (const row of data) {
      if (row.target_id && (row.vote_value === 1 || row.vote_value === -1)) {
        map[String(row.target_id)] = row.vote_value
      }
    }
    return map
  } catch {
    return {}
  }
}

export async function getUserSingleVote(params: {
  supabase: SupabaseClient
  userId?: string | null
  targetType: VoteTargetType
  targetId: string
}): Promise<1 | -1 | 0> {
  const { supabase, userId, targetType, targetId } = params
  if (!userId || !targetId) return 0

  try {
    const { data } = await supabase
      .from('votes')
      .select('vote_value')
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .maybeSingle()

    if (data?.vote_value === 1 || data?.vote_value === -1) {
      return data.vote_value
    }
    return 0
  } catch {
    return 0
  }
}
