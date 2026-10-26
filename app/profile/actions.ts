'use server'

import fs from 'fs'
import path from 'path'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export type ProfileActionState = {
  error?: string
  success?: string
}

async function saveProfileMediaAsset(params: {
  file: File
  userId: string
  slot: 'avatar' | 'banner'
  supabase: Awaited<ReturnType<typeof createClient>>
}): Promise<string | null> {
  const { file, userId, slot, supabase } = params
  const ext = path.extname(file.name).toLowerCase() || '.jpg'
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg', '.gif'].includes(ext)
    ? ext
    : '.jpg'
  const filename = `${slot}-${Date.now()}${safeExt}`
  const relativePath = `profiles/${userId}/${filename}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  let resolvedUrl: string | null = null

  // 1. Guardar en disco local (`public/profiles/<userId>/`) si el sistema de archivos es escribible
  try {
    const publicDir = path.resolve(process.cwd(), 'public')
    const userDir = path.join(/*turbopackIgnore: true*/ publicDir, 'profiles', userId)
    fs.mkdirSync(userDir, { recursive: true })
    fs.writeFileSync(path.join(userDir, filename), buffer)
    resolvedUrl = `/${relativePath}`
  } catch {
    // En producción serverless (Vercel), el disco es de solo lectura; usamos el CDN de Supabase Storage
  }

  // 2. Subir también al bucket `public-media` del CDN en Supabase Storage
  try {
    const { error: uploadErr } = await supabase.storage
      .from('public-media')
      .upload(relativePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      })

    if (!uploadErr) {
      const { data: pubData } = supabase.storage.from('public-media').getPublicUrl(relativePath)
      if (!resolvedUrl && pubData?.publicUrl) {
        resolvedUrl = pubData.publicUrl
      }
    }
  } catch {
    // Fallback al archivo local si el bucket no está disponible
  }

  return resolvedUrl
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
  const rawUsername = String(formData.get('username') ?? '').trim()
  const username = rawUsername
    ? rawUsername.toLowerCase().replace(/[^a-z0-9_.-]/g, '')
    : user.profile?.username || null
  const bio = String(formData.get('bio') ?? '').trim()
  const statusUpdate = String(formData.get('status_update') ?? '').trim()
  const birthday = String(formData.get('birthday') ?? '').trim() || null
  const gender = String(formData.get('gender') ?? 'unspecified').trim()
  let avatarUrl = String(formData.get('avatar_url') ?? '').trim() || null
  let bannerUrl = String(formData.get('banner_url') ?? '').trim() || null
  const favoriteProductId = String(formData.get('favorite_product_id') ?? '').trim() || null

  const supabase = await createClient()

  // Procesar subida directa al CDN si el usuario adjuntó archivo de Avatar o Banner
  const avatarFile = formData.get('avatar_file')
  if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
    const uploadedAvatar = await saveProfileMediaAsset({
      file: avatarFile,
      userId: user.id,
      slot: 'avatar',
      supabase,
    })
    if (uploadedAvatar) avatarUrl = uploadedAvatar
  }

  const bannerFile = formData.get('banner_file')
  if (bannerFile && bannerFile instanceof File && bannerFile.size > 0) {
    const uploadedBanner = await saveProfileMediaAsset({
      file: bannerFile,
      userId: user.id,
      slot: 'banner',
      supabase,
    })
    if (uploadedBanner) bannerUrl = uploadedBanner
  }

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
  revalidatePath('/community')
  revalidatePath('/')
  return { success: 'Perfil y activos CDN actualizados correctamente.' }
}
