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

/**
 * Calcula el conteo real y honesto de upvotes y downvotes desde la tabla `public.votes`
 * para una lista de objetivos, eliminando cualquier número placeholder artificial.
 */
export async function getAggregateVotesMap(params: {
  supabase: SupabaseClient
  targetType: VoteTargetType
  targetIds: string[]
}): Promise<Record<string, { upvotes: number; downvotes: number }>> {
  const { supabase, targetType, targetIds } = params
  const result: Record<string, { upvotes: number; downvotes: number }> = {}

  for (const id of targetIds) {
    result[id] = { upvotes: 0, downvotes: 0 }
  }

  if (targetIds.length === 0) return result

  try {
    const { data, error } = await supabase
      .from('votes')
      .select('target_id, vote_value')
      .eq('target_type', targetType)
      .in('target_id', targetIds)

    if (error || !data) return result

    for (const row of data) {
      const tid = String(row.target_id)
      if (!result[tid]) {
        result[tid] = { upvotes: 0, downvotes: 0 }
      }
      if (row.vote_value === 1) {
        result[tid].upvotes += 1
      } else if (row.vote_value === -1) {
        result[tid].downvotes += 1
      }
    }

    return result
  } catch {
    return result
  }
}
