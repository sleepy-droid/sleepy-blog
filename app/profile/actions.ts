'use server'

import fs from 'fs'
import path from 'path'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import {
  encodeProfileStatusWithFavSong,
  extractProfileFavSongId,
  extractProfileStatus,
  extractProfileStickers,
} from '@/lib/profile-presets'

export type ProfileActionState = {
  error?: string
  success?: string
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

  // 2. Subir también al bucket `public-media` del CDN en Supabase Storage (prioritario para Vercel)
  try {
    const { error: uploadErr } = await supabase.storage
      .from('public-media')
      .upload(relativePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      })

    if (!uploadErr) {
      const { data: pubData } = supabase.storage.from('public-media').getPublicUrl(relativePath)
      if (pubData?.publicUrl) {
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
  const rawStatusUpdate = String(formData.get('status_update') ?? '').trim()
  const cleanStatusUpdate = extractProfileStatus(rawStatusUpdate)
  const rawBirthday = String(formData.get('birthday') ?? '').trim()
  const birthday = /^\d{4}-\d{2}-\d{2}$/.test(rawBirthday) ? rawBirthday : null
  const rawGender = String(formData.get('gender') ?? 'unspecified').trim()
  const validGenders = ['male', 'female', 'gender_neutral', 'unspecified'] as const
  const gender = (validGenders as readonly string[]).includes(rawGender)
    ? (rawGender as (typeof validGenders)[number])
    : 'unspecified'

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

  // Resolver favorite_product_id de forma segura (la columna en PostgreSQL es de tipo UUID)
  let resolvedFavoriteUuid: string | null = null
  let presetSlugForMarker: string | null = null

  if (favoriteProductId && favoriteProductId !== 'none') {
    if (UUID_REGEX.test(favoriteProductId)) {
      resolvedFavoriteUuid = favoriteProductId
    } else {
      // Buscar si existe un producto con ese slug en public.products para obtener su UUID real
      const { data: matchedProduct } = await supabase
        .from('products')
        .select('id, slug')
        .eq('slug', favoriteProductId)
        .maybeSingle()

      if (matchedProduct?.id && UUID_REGEX.test(matchedProduct.id)) {
        resolvedFavoriteUuid = matchedProduct.id
      }
      presetSlugForMarker = favoriteProductId
    }
  }

  const rawStickers = formData.get('stickers')
  const stickerIds =
    rawStickers !== null
      ? String(rawStickers)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : extractProfileStickers(user.profile?.status_update)

  const encodedStatus = encodeProfileStatusWithFavSong(
    cleanStatusUpdate,
    presetSlugForMarker,
    stickerIds
  )

  const nowIso = new Date().toISOString()

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName || null,
      username: username || null,
      bio: bio || null,
      status_update: encodedStatus,
      birthday,
      gender,
      avatar_url: avatarUrl,
      banner_url: bannerUrl,
      favorite_product_id: resolvedFavoriteUuid,
      updated_at: nowIso,
    })
    .eq('id', user.id)

  if (error) {
    // Fallback por si alguna columna extendida tuviera conflicto en la instancia
    const { error: fallbackError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName || null,
        username: username || null,
        bio: bio || null,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        favorite_product_id: resolvedFavoriteUuid,
        updated_at: nowIso,
      })
      .eq('id', user.id)

    if (fallbackError) {
      return { error: fallbackError.message || 'No se pudo guardar la información del perfil.' }
    }
  }

  revalidatePath('/profile')
  if (username) revalidatePath(`/u/${username}`)
  revalidatePath('/community')
  revalidatePath('/')
  return { success: 'Perfil actualizado al instante.' }
}

/**
 * One-click instant profile customization (Steam / Dota 2 & Facebook style).
 * Allows immediate saving of Banner, Avatar, Stickers, Favorite Song, Status, or Bio with a single click.
 */
export async function quickCustomizeProfile(patch: {
  avatarUrl?: string
  bannerUrl?: string
  favoriteSongId?: string
  stickers?: string[]
  statusUpdate?: string
  bio?: string
  displayName?: string
  username?: string
  birthday?: string | null
  gender?: 'male' | 'female' | 'gender_neutral' | 'unspecified'
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser()
  if (!user) {
    return { ok: false, error: 'Debes iniciar sesión.' }
  }

  const supabase = await createClient()
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const existingStatus = extractProfileStatus(currentProfile?.status_update)
  const existingFavSong = extractProfileFavSongId(currentProfile)
  const existingStickers = extractProfileStickers(currentProfile?.status_update)

  const nextCleanStatus =
    patch.statusUpdate !== undefined
      ? extractProfileStatus(patch.statusUpdate)
      : existingStatus
  const nextFavSongId =
    patch.favoriteSongId !== undefined ? patch.favoriteSongId : existingFavSong
  const nextStickers =
    patch.stickers !== undefined ? patch.stickers : existingStickers

  let resolvedFavoriteUuid: string | null =
    currentProfile?.favorite_product_id || null
  let presetSlugForMarker: string | null = nextFavSongId || null

  if (nextFavSongId && nextFavSongId !== 'none') {
    if (UUID_REGEX.test(nextFavSongId)) {
      resolvedFavoriteUuid = nextFavSongId
      presetSlugForMarker = nextFavSongId
    } else {
      const { data: matchedProduct } = await supabase
        .from('products')
        .select('id, slug')
        .eq('slug', nextFavSongId)
        .maybeSingle()

      if (matchedProduct?.id && UUID_REGEX.test(matchedProduct.id)) {
        resolvedFavoriteUuid = matchedProduct.id
      }
      presetSlugForMarker = nextFavSongId
    }
  }

  const encodedStatus = encodeProfileStatusWithFavSong(
    nextCleanStatus,
    presetSlugForMarker,
    nextStickers
  )

  const updatePayload: Record<string, unknown> = {
    status_update: encodedStatus,
    favorite_product_id: resolvedFavoriteUuid,
    updated_at: new Date().toISOString(),
  }

  if (patch.avatarUrl !== undefined) updatePayload.avatar_url = patch.avatarUrl
  if (patch.bannerUrl !== undefined) updatePayload.banner_url = patch.bannerUrl
  if (patch.bio !== undefined) updatePayload.bio = patch.bio
  if (patch.displayName !== undefined)
    updatePayload.display_name = patch.displayName
  if (patch.username !== undefined) {
    updatePayload.username = patch.username
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, '')
  }
  if (patch.birthday !== undefined) updatePayload.birthday = patch.birthday
  if (patch.gender !== undefined) updatePayload.gender = patch.gender

  const { error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id)

  if (error) {
    return { ok: false, error: error.message }
  }

  // Registrar evento BI de personalización de identidad
  const { recordTelemetryEvent } = await import('@/lib/telemetry')
  recordTelemetryEvent({
    eventType: 'profile_customized',
    targetType: 'profile',
    targetId: user.id,
    userId: user.id,
    metadata: {
      updated_fields: Object.keys(patch),
      stickers_count: nextStickers.length,
      favorite_song_id: nextFavSongId || null,
    },
  }).catch(() => {})

  revalidatePath('/profile')
  const uname = (updatePayload.username as string) || currentProfile?.username
  if (uname) revalidatePath(`/u/${uname}`)
  revalidatePath('/community')
  return { ok: true }
}
