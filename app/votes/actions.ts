'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { recordTelemetryEvent } from '@/lib/telemetry'
import type { VoteTargetType } from '@/lib/types'

export type ToggleVoteResult = {
  success?: boolean
  error?: string
  requireAuth?: boolean
  newLikeCount?: number
  newDownvoteCount?: number
  hasVoted?: boolean
  userVote?: 1 | -1 | 0
}

export async function getMyVoteState(
  targetType: VoteTargetType,
  targetId: string
): Promise<{ userVote: 1 | -1 | 0; upvotes?: number; downvotes?: number }> {
  const user = await getCurrentUser()
  const supabase = await createClient()

  const [{ count: upvoteCount }, { count: downvoteCount }, userVoteRow] = await Promise.all([
    supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('vote_value', 1),
    supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('vote_value', -1),
    user
      ? supabase
          .from('votes')
          .select('vote_value')
          .eq('user_id', user.id)
          .eq('target_type', targetType)
          .eq('target_id', targetId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const v = userVoteRow?.data?.vote_value
  return {
    userVote: v === 1 || v === -1 ? v : 0,
    upvotes: typeof upvoteCount === 'number' ? upvoteCount : undefined,
    downvotes: typeof downvoteCount === 'number' ? downvoteCount : undefined,
  }
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
  let userVote: 1 | -1 | 0 = 0

  if (existingVote) {
    if (existingVote.vote_value === voteValue) {
      // Toggle off (remove vote)
      await supabase.from('votes').delete().eq('id', existingVote.id)
      hasVoted = false
      userVote = 0
    } else {
      // Change vote value (e.g. from 1 to -1)
      await supabase.from('votes').update({ vote_value: voteValue }).eq('id', existingVote.id)
      hasVoted = true
      userVote = voteValue
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
    userVote = voteValue
  }

  // Calculate new aggregate vote count from votes table
  const [{ count: upvoteCount }, { count: downvoteCount }] = await Promise.all([
    supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('vote_value', 1),
    supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('vote_value', -1),
  ])

  const newLikes = upvoteCount || 0
  const newDowns = downvoteCount || 0

  // Update target table aggregate counts
  if (targetType === 'post') {
    await supabase
      .from('posts')
      .update({ like_count: newLikes, upvotes: newLikes, downvotes: newDowns })
      .eq('id', targetId)
    revalidatePath('/')
    revalidatePath(`/posts/${targetId}`)
  } else if (targetType === 'product') {
    await supabase
      .from('products')
      .update({ upvotes: newLikes, downvotes: newDowns })
      .eq('id', targetId)
    const { data: prod } = await supabase
      .from('products')
      .select('slug')
      .eq('id', targetId)
      .maybeSingle()
    revalidatePath('/shop')
    revalidatePath(`/shop/${targetId}`)
    if (prod?.slug) {
      revalidatePath(`/shop/${prod.slug}`)
    }
  } else if (targetType === 'forum_thread') {
    await supabase
      .from('forum_threads')
      .update({ upvotes: newLikes, downvotes: newDowns })
      .eq('id', targetId)
    revalidatePath('/community')
    revalidatePath(`/community/${targetId}`)
  } else if (targetType === 'comment') {
    await supabase
      .from('comments')
      .update({ upvotes: newLikes, downvotes: newDowns })
      .eq('id', targetId)
  }

  // Record in Telemetry Vault for RED Recordings Plus / PowerBI
  await recordTelemetryEvent({
    eventType: 'vote_cast',
    targetType,
    targetId,
    userId: user.id,
    metadata: { voteValue: userVote, upvotes: newLikes, downvotes: newDowns },
  })

  return {
    success: true,
    newLikeCount: newLikes,
    newDownvoteCount: newDowns,
    hasVoted,
    userVote,
  }
}
