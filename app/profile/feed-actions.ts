'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export type FeedActionState = {
  error?: string
  success?: string
}

/**
 * Publicar una nota corta en el feed personal del usuario (estilo Twitter/X).
 */
export async function postFeedNote(
  _prev: FeedActionState,
  formData: FormData
): Promise<FeedActionState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión para publicar en tu feed.' }
  }

  const body = String(formData.get('body') ?? '').trim()
  const username = String(formData.get('username') ?? '').trim()

  if (!body) {
    return { error: 'Escribe algo para publicar tu nota.' }
  }

  if (body.length > 500) {
    return { error: 'La nota no puede exceder los 500 caracteres.' }
  }

  const supabase = await createClient()

  // Insertar en la tabla profile_updates
  const { error } = await supabase.from('profile_updates').insert({
    user_id: user.id,
    body,
    status: 'visible',
    created_at: new Date().toISOString(),
  })

  if (error) {
    return { error: error.message || 'No se pudo publicar la nota en el feed.' }
  }

  if (username) {
    revalidatePath(`/u/${username}`)
  }
  revalidatePath('/profile')
  revalidatePath('/')

  return { success: 'Nota publicada en tu feed.' }
}
