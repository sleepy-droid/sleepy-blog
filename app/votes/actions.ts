'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import type { VoteTargetType } from '@/lib/types'

export type ToggleVoteResult = {
  success?: boolean
  error?: string
  requireAuth?: boolean
  newLikeCount?: number
  hasVoted?: boolean
}

export async function toggleVote(
  targetType: VoteTargetType,
  targetId: string,
  voteValue: 1 | -1 = 1
): Promise<ToggleVoteResult> {
  const user = await getCurrentUser()
  if (!user) {
    return { requireAuth: true, error: 'Debes iniciar sesión para registrar tu voto.' }
  }

  const supabase = await createClient()

  // Check if existing vote exists
  const { data: existingVote } = await supabase
    .from('votes')
    .select('id, vote_value')
    .eq('user_id', user.id)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .maybeSingle()

  let hasVoted = false

  if (existingVote) {
    if (existingVote.vote_value === voteValue) {
      // Toggle off (remove vote)
      await supabase.from('votes').delete().eq('id', existingVote.id)
      hasVoted = false
    } else {
      // Change vote value (e.g. from 1 to -1)
      await supabase.from('votes').update({ vote_value: voteValue }).eq('id', existingVote.id)
      hasVoted = true
    }
  } else {
    // Insert new vote
    await supabase.from('votes').insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      vote_value: voteValue,
    })
    hasVoted = true
  }

  // Calculate new aggregate vote count from votes table
  const { count: upvoteCount } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('vote_value', 1)

  const { count: downvoteCount } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .eq('vote_value', -1)

  const newLikes = upvoteCount || 0
  const newDowns = downvoteCount || 0

  // Update target table aggregate counts
  if (targetType === 'post') {
    await supabase.from('posts').update({ like_count: newLikes, upvotes: newLikes, downvotes: newDowns }).eq('id', targetId)
    revalidatePath('/')
    revalidatePath(`/posts/${targetId}`)
  } else if (targetType === 'product') {
    await supabase.from('products').update({ upvotes: newLikes, downvotes: newDowns }).eq('id', targetId)
    revalidatePath('/shop')
    revalidatePath(`/shop/${targetId}`)
  } else if (targetType === 'forum_thread') {
    await supabase.from('forum_threads').update({ upvotes: newLikes, downvotes: newDowns }).eq('id', targetId)
    revalidatePath('/community')
    revalidatePath(`/community/${targetId}`)
  }

  return {
    success: true,
    newLikeCount: newLikes,
    hasVoted,
  }
}
