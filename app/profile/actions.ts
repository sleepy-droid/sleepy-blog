'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export type ProfileActionState = {
  error?: string
  success?: string
}

export async function updateProfile(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión para actualizar tu perfil.' }
  }

  const displayName = String(formData.get('display_name') ?? '').trim()
  const username = String(formData.get('username') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()
  const statusUpdate = String(formData.get('status_update') ?? '').trim()
  const birthday = String(formData.get('birthday') ?? '').trim() || null
  const gender = String(formData.get('gender') ?? 'unspecified').trim()
  const avatarUrl = String(formData.get('avatar_url') ?? '').trim() || null
  const bannerUrl = String(formData.get('banner_url') ?? '').trim() || null
  const favoriteProductId = String(formData.get('favorite_product_id') ?? '').trim() || null

  const supabase = await createClient()

  // Si cambió la canción favorita, registramos un evento especial en el feed
  if (favoriteProductId && favoriteProductId !== user.profile?.favorite_product_id) {
    try {
      await supabase.from('profile_updates').insert({
        user_id: user.id,
        body: `[FAVORITE_SONG_CHANGED]:${favoriteProductId}`,
        status: 'visible',
        created_at: new Date().toISOString(),
      })
    } catch {
      // Ignorar fallo de log si la tabla no está accesible
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName || null,
      username: username || null,
      bio: bio || null,
      status_update: statusUpdate || null,
      birthday: birthday || null,
      gender: gender as 'male' | 'female' | 'gender_neutral' | 'unspecified',
      avatar_url: avatarUrl,
      banner_url: bannerUrl,
      favorite_product_id: favoriteProductId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message || 'No se pudo guardar la información del perfil.' }
  }

  revalidatePath('/profile')
  if (username) revalidatePath(`/u/${username}`)
  revalidatePath('/')
  return { success: 'Perfil actualizado correctamente.' }
}
