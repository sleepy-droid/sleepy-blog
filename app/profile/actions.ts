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

  const supabase = await createClient()

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
