'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export type CommentActionState = {
  error?: string
  success?: string
}

/**
 * Crear comentario en un post.
 * Requiere sesión. RLS también exige auth.uid() = user_id.
 */
export async function createComment(
  _prev: CommentActionState,
  formData: FormData
): Promise<CommentActionState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión para comentar.' }
  }

  const postId = String(formData.get('post_id') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()

  if (!postId) {
    return { error: 'Publicación no válida.' }
  }
  if (body.length < 1 || body.length > 2000) {
    return { error: 'El comentario debe tener entre 1 y 2000 caracteres.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    user_id: user.id,
    body,
  })

  if (error) {
    return { error: error.message || 'No se pudo publicar el comentario.' }
  }

  revalidatePath(`/posts/${postId}`)
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
  const body = String(formData.get('body') ?? '').trim()

  if (!commentId || !postId) {
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

  revalidatePath(`/posts/${postId}`)
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
  if (!commentId) return

  const supabase = await createClient()
  await supabase.from('comments').delete().eq('id', commentId)

  if (postId) revalidatePath(`/posts/${postId}`)
  revalidatePath('/admin')
  revalidatePath('/admin/comments')
}
