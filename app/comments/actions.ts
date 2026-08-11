'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export type CommentActionState = {
  error?: string
  success?: string
}

/**
 * Crear comentario polimórfico (en post, producto, hilo de foro o actualización).
 * Requiere sesión activa.
 */
export async function createComment(
  _prev: CommentActionState,
  formData: FormData
): Promise<CommentActionState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión para comentar.' }
  }

  const supabase = await createClient()

  // Check if user is muted by admin for spamming
  const { data: profile } = await supabase
    .from('profiles')
    .select('can_comment')
    .eq('id', user.id)
    .maybeSingle()

  if (profile && profile.can_comment === false) {
    return { error: 'Tu cuenta ha sido restringida temporalmente para publicar comentarios.' }
  }

  const postId = String(formData.get('post_id') ?? '').trim()
  const targetType = String(formData.get('target_type') ?? (postId ? 'post' : 'product')).trim()
  const targetId = String(formData.get('target_id') ?? postId).trim()
  const body = String(formData.get('body') ?? '').trim()

  if (!targetId) {
    return { error: 'Destino de comentario no válido.' }
  }
  if (body.length < 1 || body.length > 2000) {
    return { error: 'El comentario debe tener entre 1 y 2000 caracteres.' }
  }

  const insertPayload: Record<string, unknown> = {
    user_id: user.id,
    body,
    target_type: targetType,
    target_id: targetId,
    status: 'visible',
  }

  // Only attach post_id if strictly targetType is post
  if (targetType === 'post' && targetId) {
    insertPayload.post_id = targetId
  }

  let { error } = await supabase.from('comments').insert(insertPayload)

  // Fallback if schema enforces post_id column
  if (error && error.message.includes('comments_post_id_fkey')) {
    delete insertPayload.post_id
    const res = await supabase.from('comments').insert(insertPayload)
    error = res.error
  }

  if (error) {
    return { error: error.message || 'No se pudo publicar el comentario.' }
  }

  if (targetType === 'post') {
    revalidatePath(`/posts/${targetId}`)
  } else if (targetType === 'product') {
    revalidatePath(`/shop/${targetId}`)
  } else if (targetType === 'forum_thread') {
    revalidatePath(`/community/${targetId}`)
    revalidatePath(`/community`)
  }
  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/comments')
  return { success: 'Comentario publicado.' }
}

/**
 * Actualizar comentario propio (o admin vía RLS).
 */
export async function updateComment(
  _prev: CommentActionState,
  formData: FormData
): Promise<CommentActionState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión.' }
  }

  const commentId = String(formData.get('comment_id') ?? '').trim()
  const postId = String(formData.get('post_id') ?? '').trim()
  const targetType = String(formData.get('target_type') ?? 'post').trim()
  const targetId = String(formData.get('target_id') ?? postId).trim()
  const body = String(formData.get('body') ?? '').trim()

  if (!commentId || !targetId) {
    return { error: 'Datos incompletos.' }
  }
  if (body.length < 1 || body.length > 2000) {
    return { error: 'El comentario debe tener entre 1 y 2000 caracteres.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('comments')
    .update({ body, updated_at: new Date().toISOString() })
    .eq('id', commentId)

  if (error) {
    return { error: error.message || 'No se pudo actualizar el comentario.' }
  }

  if (targetType === 'post') {
    revalidatePath(`/posts/${targetId}`)
  } else if (targetType === 'product') {
    revalidatePath(`/shop/${targetId}`)
  }
  revalidatePath('/admin/comments')
  return { success: 'Comentario actualizado.' }
}

/**
 * Eliminar comentario propio o como admin.
 */
export async function deleteComment(formData: FormData): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return

  const commentId = String(formData.get('comment_id') ?? '').trim()
  const postId = String(formData.get('post_id') ?? '').trim()
  const targetType = String(formData.get('target_type') ?? 'post').trim()
  const targetId = String(formData.get('target_id') ?? postId).trim()
  if (!commentId) return

  const supabase = await createClient()
  await supabase.from('comments').delete().eq('id', commentId)

  if (targetType === 'post' && targetId) revalidatePath(`/posts/${targetId}`)
  if (targetType === 'product' && targetId) revalidatePath(`/shop/${targetId}`)
  revalidatePath('/admin')
  revalidatePath('/admin/comments')
}
