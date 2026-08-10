'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/auth'

export type AdminActionState = {
  error?: string
  success?: string
}

function parsePrice(raw: FormDataEntryValue | null): number {
  const n = Number(String(raw ?? '0').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

/**
 * Crear un post (solo admin).
 */
export async function createPost(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()

  const title = String(formData.get('title') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim() || 'General'
  const image_url = String(formData.get('image_url') ?? '').trim() || null
  const media_url = String(formData.get('media_url') ?? '').trim() || null
  const price = parsePrice(formData.get('price'))

  if (!title || title.length < 2) {
    return { error: 'El título es obligatorio (mín. 2 caracteres).' }
  }
  if (!content || content.length < 2) {
    return { error: 'El contenido es obligatorio.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('posts')
    .insert({
      title,
      content,
      category,
      image_url,
      media_url,
      price,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message || 'No se pudo crear la publicación.' }
  }

  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/posts')
  redirect(`/admin/posts/${data.id}/edit?created=1`)
}

/**
 * Actualizar un post existente.
 */
export async function updatePost(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()

  const id = String(formData.get('id') ?? '').trim()
  const title = String(formData.get('title') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim() || 'General'
  const image_url = String(formData.get('image_url') ?? '').trim() || null
  const media_url = String(formData.get('media_url') ?? '').trim() || null
  const price = parsePrice(formData.get('price'))

  if (!id) return { error: 'ID de publicación inválido.' }
  if (!title || !content) {
    return { error: 'Título y contenido son obligatorios.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('posts')
    .update({
      title,
      content,
      category,
      image_url,
      media_url,
      price,
    })
    .eq('id', id)

  if (error) {
    return { error: error.message || 'No se pudo guardar.' }
  }

  revalidatePath('/')
  revalidatePath(`/posts/${id}`)
  revalidatePath('/admin')
  revalidatePath('/admin/posts')
  return { success: 'Publicación actualizada.' }
}

/**
 * Eliminar un post.
 */
export async function deletePost(formData: FormData): Promise<void> {
  await requireAdmin()

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  const supabase = await createClient()
  await supabase.from('posts').delete().eq('id', id)

  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/posts')
  revalidatePath('/admin/comments')
  redirect('/admin/posts')
}

/**
 * Actualizar comentario desde el panel admin.
 */
export async function adminUpdateComment(formData: FormData): Promise<void> {
  await requireAdmin()

  const id = String(formData.get('id') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const postId = String(formData.get('post_id') ?? '').trim()

  if (!id || body.length < 1) return

  const supabase = await createClient()
  await supabase
    .from('comments')
    .update({ body, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (postId) revalidatePath(`/posts/${postId}`)
  revalidatePath('/admin/comments')
}

/**
 * Ocultar comentario (moderación suave para spam).
 */
export async function adminHideComment(formData: FormData): Promise<void> {
  const admin = await requireAdmin()

  const id = String(formData.get('id') ?? '').trim()
  const postId = String(formData.get('post_id') ?? '').trim()
  const targetId = String(formData.get('target_id') ?? postId).trim()
  if (!id) return

  const supabase = await createClient()
  await supabase
    .from('comments')
    .update({
      status: 'hidden',
      hidden_at: new Date().toISOString(),
      hidden_by: admin.id,
    })
    .eq('id', id)

  if (targetId) revalidatePath(`/posts/${targetId}`)
  if (targetId) revalidatePath(`/shop/${targetId}`)
  revalidatePath('/admin')
  revalidatePath('/admin/comments')
}

/**
 * Restablecer comentario a visible.
 */
export async function adminRestoreComment(formData: FormData): Promise<void> {
  await requireAdmin()

  const id = String(formData.get('id') ?? '').trim()
  const postId = String(formData.get('post_id') ?? '').trim()
  const targetId = String(formData.get('target_id') ?? postId).trim()
  if (!id) return

  const supabase = await createClient()
  await supabase
    .from('comments')
    .update({
      status: 'visible',
      hidden_at: null,
      hidden_by: null,
    })
    .eq('id', id)

  if (targetId) revalidatePath(`/posts/${targetId}`)
  if (targetId) revalidatePath(`/shop/${targetId}`)
  revalidatePath('/admin')
  revalidatePath('/admin/comments')
}

/**
 * Eliminar comentario permanentemente desde admin.
 */
export async function adminDeleteComment(formData: FormData): Promise<void> {
  await requireAdmin()

  const id = String(formData.get('id') ?? '').trim()
  const postId = String(formData.get('post_id') ?? '').trim()
  const targetId = String(formData.get('target_id') ?? postId).trim()
  if (!id) return

  const supabase = await createClient()
  await supabase.from('comments').delete().eq('id', id)

  if (targetId) revalidatePath(`/posts/${targetId}`)
  if (targetId) revalidatePath(`/shop/${targetId}`)
  revalidatePath('/admin')
  revalidatePath('/admin/comments')
}

/**
 * Crear producto en el catálogo (solo admin).
 */
export async function createProduct(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()

  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const category = String(formData.get('category') ?? 'music').trim()
  const fulfillment = String(formData.get('fulfillment') ?? 'digital').trim()
  const price_cents = Math.round(Number(formData.get('price') || 0) * 100)
  const thumbnail_url = String(formData.get('thumbnail_url') ?? '').trim() || null
  const mp3_url = String(formData.get('mp3_url') ?? '').trim() || null
  const wav_url = String(formData.get('wav_url') ?? '').trim() || null
  const video_url = String(formData.get('video_url') ?? '').trim() || null
  const acapella_url = String(formData.get('acapella_url') ?? '').trim() || null
  const instrumental_url = String(formData.get('instrumental_url') ?? '').trim() || null

  if (!name || name.length < 2) {
    return { error: 'El nombre del producto es obligatorio.' }
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `product-${Date.now()}`

  const supabase = await createClient()
  const { error } = await supabase.from('products').insert({
    slug,
    name,
    description,
    category,
    fulfillment,
    price_cents,
    currency: 'USD',
    thumbnail_url,
    mp3_url,
    wav_url,
    video_url,
    acapella_url,
    instrumental_url,
    audio_preview_url: mp3_url || wav_url,
    is_published: true,
    is_featured: true,
  })

  if (error) {
    return { error: error.message || 'Error al guardar el producto.' }
  }

  revalidatePath('/shop')
  revalidatePath('/admin')
  revalidatePath('/admin/products')
  redirect('/admin/products?created=1')
}

