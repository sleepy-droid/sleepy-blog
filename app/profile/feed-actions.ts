'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export type FeedActionState = {
  error?: string
  success?: string
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Publicar una nota corta, un "Song Mood del Día" en el feed personal,
 * o un comentario en el muro del perfil de otro usuario.
 */
export async function postFeedNote(
  _prev: FeedActionState,
  formData: FormData
): Promise<FeedActionState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión para publicar en el feed.' }
  }

  if (user.profile?.can_comment === false) {
    return { error: 'Tu cuenta tiene restringida temporalmente la publicación de comentarios.' }
  }

  const body = String(formData.get('body') ?? '').trim()
  const moodSongId = String(formData.get('mood_song_id') ?? '').trim()
  const username = String(formData.get('username') ?? '').trim()
  const targetUserId = String(formData.get('target_user_id') ?? '').trim()
  const isWallComment = String(formData.get('is_wall_comment') ?? '') === 'true'

  const hasMoodSong = Boolean(moodSongId && moodSongId !== 'none')

  if (!body && !hasMoodSong) {
    return { error: 'Escribe una nota o selecciona una Canción Mood del Día para compartir.' }
  }

  if (body.length > 500) {
    return { error: 'El mensaje no puede exceder los 500 caracteres.' }
  }

  const supabase = await createClient()

  // Caso A: Visitante dejando un comentario en el muro de otro usuario (/u/[username])
  if (isWallComment && targetUserId && targetUserId !== user.id) {
    if (UUID_REGEX.test(targetUserId)) {
      const { error: wallErr } = await supabase.from('comments').insert({
        user_id: user.id,
        post_id: null,
        target_type: 'profile_update',
        target_id: targetUserId,
        body,
        status: 'visible',
      })

      if (wallErr) {
        return { error: wallErr.message || 'No se pudo publicar el comentario en este muro.' }
      }
    } else {
      // Fallback en profile_updates si el perfil es un preset sin UUID
      const { error: fallbackErr } = await supabase.from('profile_updates').insert({
        user_id: user.id,
        body,
        status: 'visible',
        created_at: new Date().toISOString(),
      })
      if (fallbackErr) {
        return { error: fallbackErr.message || 'No se pudo publicar el comentario.' }
      }
    }

    if (username) revalidatePath(`/u/${username}`)
    revalidatePath('/profile')
    revalidatePath('/admin/comments')
    revalidatePath('/admin')
    return { success: 'Comentario publicado en el muro.' }
  }

  // Caso B: El propietario publica una nota o su "Canción Mood del Día 🔥"
  const formattedBody = hasMoodSong
    ? `[FAVORITE_SONG_CHANGED]:${moodSongId}${body ? `||${body}` : ''}`
    : body

  const { error } = await supabase.from('profile_updates').insert({
    user_id: user.id,
    body: formattedBody,
    status: 'visible',
    created_at: new Date().toISOString(),
  })

  if (error) {
    return { error: error.message || 'No se pudo publicar en tu feed.' }
  }

  if (username) {
    revalidatePath(`/u/${username}`)
  }
  revalidatePath('/profile')
  revalidatePath('/admin/comments')
  revalidatePath('/admin')
  revalidatePath('/')

  return {
    success: hasMoodSong
      ? 'Canción Mood del Día compartida en tu feed.'
      : 'Nota publicada en tu feed.',
  }
}

/**
 * Editar una nota/mood del feed (`profile_updates`) o un comentario (`comments`) propio o como Admin.
 */
export async function updateFeedItem(formData: FormData): Promise<FeedActionState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión para editar.' }
  }

  const itemId = String(formData.get('item_id') ?? '').trim()
  const itemSource = String(formData.get('item_source') ?? 'profile_update').trim()
  const body = String(formData.get('body') ?? '').trim()
  const moodSongId = String(formData.get('mood_song_id') ?? '').trim()
  const username = String(formData.get('username') ?? '').trim()

  if (!itemId) {
    return { error: 'ID de elemento no válido.' }
  }

  const hasMoodSong = Boolean(moodSongId && moodSongId !== 'none')
  if (!body && !hasMoodSong) {
    return { error: 'El contenido no puede quedar vacío.' }
  }

  const supabase = await createClient()

  if (itemSource === 'comment') {
    let query = supabase
      .from('comments')
      .update({ body, updated_at: new Date().toISOString() })
      .eq('id', itemId)

    if (!user.isAdmin) {
      query = query.eq('user_id', user.id)
    }

    const { error } = await query
    if (error) {
      return { error: error.message || 'No se pudo actualizar el comentario.' }
    }
  } else {
    const newBody = hasMoodSong
      ? `[FAVORITE_SONG_CHANGED]:${moodSongId}${body ? `||${body}` : ''}`
      : body

    let query = supabase
      .from('profile_updates')
      .update({ body: newBody })
      .eq('id', itemId)

    if (!user.isAdmin) {
      query = query.eq('user_id', user.id)
    }

    const { error } = await query
    if (error) {
      return { error: error.message || 'No se pudo actualizar la nota del feed.' }
    }
  }

  if (username) revalidatePath(`/u/${username}`)
  revalidatePath('/profile')
  revalidatePath('/admin/comments')
  revalidatePath('/admin')
  return { success: 'Publicación actualizada.' }
}

/**
 * Eliminar una nota/mood del feed (`profile_updates`) o comentario (`comments`) propio o como Admin.
 */
export async function deleteFeedItem(formData: FormData): Promise<FeedActionState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión para eliminar.' }
  }

  const itemId = String(formData.get('item_id') ?? '').trim()
  const itemSource = String(formData.get('item_source') ?? 'profile_update').trim()
  const username = String(formData.get('username') ?? '').trim()

  if (!itemId) {
    return { error: 'ID de elemento no válido.' }
  }

  const supabase = await createClient()

  if (itemSource === 'comment') {
    let query = supabase.from('comments').delete().eq('id', itemId)
    if (!user.isAdmin) {
      query = query.eq('user_id', user.id)
    }
    const { error } = await query
    if (error) {
      return { error: error.message || 'No se pudo eliminar el comentario.' }
    }
  } else {
    let query = supabase.from('profile_updates').delete().eq('id', itemId)
    if (!user.isAdmin) {
      query = query.eq('user_id', user.id)
    }
    const { error } = await query
    if (error) {
      return { error: error.message || 'No se pudo eliminar la publicación del feed.' }
    }
  }

  if (username) revalidatePath(`/u/${username}`)
  revalidatePath('/profile')
  revalidatePath('/admin/comments')
  revalidatePath('/admin')
  return { success: 'Publicación eliminada.' }
}
