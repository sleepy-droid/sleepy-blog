'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { normalizeMediaUrl } from '@/lib/utils'

export type AdminActionState = {
  error?: string
  success?: string
}

function parsePrice(raw: FormDataEntryValue | null): number {
  const n = Number(String(raw ?? '0').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

/**
 * Crear un post (solo admin). Imagen NO es obligatoria.
 * Guarda tanto image_url como cover_url para evitar errores de cache de esquema en Supabase.
 */
export async function createPost(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()

  const title = String(formData.get('title') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim() || 'General'
  const linked_product_id = String(formData.get('linked_product_id') ?? '').trim() || null
  const image_url = normalizeMediaUrl(formData.get('image_url') as string) || null
  const media_url = normalizeMediaUrl(formData.get('media_url') as string) || null
  const price = parsePrice(formData.get('price'))

  if (!title || title.length < 2) {
    return { error: 'El título es obligatorio (mín. 2 caracteres).' }
  }
  if (!content || content.length < 2) {
    return { error: 'El contenido es obligatorio.' }
  }

  const supabase = await createClient()

  const postPayload: Record<string, unknown> = {
    title,
    content,
    category,
    image_url,
    cover_url: image_url,
    media_url,
    price,
    is_published: true,
  }

  if (linked_product_id) {
    postPayload.linked_product_id = linked_product_id
  }

  let { data, error } = await supabase
    .from('posts')
    .insert(postPayload)
    .select('id')
    .single()

  if (error && (error.message.includes('linked_product_id') || error.message.includes('schema cache'))) {
    delete postPayload.linked_product_id
    const res = await supabase.from('posts').insert(postPayload).select('id').single()
    data = res.data
    error = res.error
  }

  if (error && error.message.includes('image_url')) {
    delete postPayload.image_url
    const res = await supabase.from('posts').insert(postPayload).select('id').single()
    data = res.data
    error = res.error
  }

  if (error) {
    return { error: error.message || 'No se pudo crear la publicación.' }
  }

  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/posts')
  redirect(`/admin/posts/${data?.id}/edit?created=1`)
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
  const linked_product_id = String(formData.get('linked_product_id') ?? '').trim() || null
  const image_url = normalizeMediaUrl(formData.get('image_url') as string) || null
  const media_url = normalizeMediaUrl(formData.get('media_url') as string) || null
  const price = parsePrice(formData.get('price'))

  if (!id) return { error: 'ID de publicación inválido.' }
  if (!title || !content) {
    return { error: 'Título y contenido son obligatorios.' }
  }

  const supabase = await createClient()

  const updatePayload: Record<string, unknown> = {
    title,
    content,
    category,
    image_url,
    cover_url: image_url,
    media_url,
    price,
  }

  if (linked_product_id) {
    updatePayload.linked_product_id = linked_product_id
  }

  let { error } = await supabase
    .from('posts')
    .update(updatePayload)
    .eq('id', id)

  if (error && (error.message.includes('linked_product_id') || error.message.includes('schema cache'))) {
    delete updatePayload.linked_product_id
    const res = await supabase.from('posts').update(updatePayload).eq('id', id)
    error = res.error
  }

  if (error && error.message.includes('image_url')) {
    delete updatePayload.image_url
    const res = await supabase.from('posts').update(updatePayload).eq('id', id)
    error = res.error
  }

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
 * Alternar visibilidad de un post (Ocultar / Archivar sin eliminar).
 */
export async function adminTogglePostVisibility(formData: FormData): Promise<void> {
  await requireAdmin()

  const id = String(formData.get('id') ?? '').trim()
  const currentStatus = String(formData.get('status') ?? 'visible').trim()
  if (!id) return

  const newStatus = currentStatus === 'visible' ? 'hidden' : 'visible'

  const supabase = await createClient()
  await supabase
    .from('posts')
    .update({ status: newStatus, is_published: newStatus === 'visible' })
    .eq('id', id)

  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/posts')
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
 * Moderar privilegios de comentario de un usuario (mutear spam sin quitar compras o cuenta).
 */
export async function toggleUserCommentPrivilege(formData: FormData): Promise<void> {
  await requireAdmin()

  const userId = String(formData.get('user_id') ?? '').trim()
  const canComment = String(formData.get('can_comment') ?? '') === 'true'

  if (!userId) return

  const supabase = await createClient()
  await supabase
    .from('profiles')
    .update({ can_comment: canComment })
    .eq('id', userId)

  revalidatePath('/admin/users')
}

/**
 * Moderar hilos del foro desde admin (Ocultar / Eliminar hilos spam).
 */
export async function adminHideThread(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  const supabase = await createClient()
  await supabase.from('forum_threads').update({ status: 'hidden' }).eq('id', id)
  revalidatePath('/admin')
  revalidatePath('/community')
}

export async function adminDeleteThread(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  const supabase = await createClient()
  await supabase.from('forum_threads').delete().eq('id', id)
  revalidatePath('/admin')
  revalidatePath('/community')
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
  const thumbnail_url = normalizeMediaUrl(formData.get('thumbnail_url') as string) || null
  const mp3_url = normalizeMediaUrl(formData.get('mp3_url') as string) || null
  const wav_url = normalizeMediaUrl(formData.get('wav_url') as string) || null
  const video_url = String(formData.get('video_url') ?? '').trim() || null
  const acapella_url = normalizeMediaUrl(formData.get('acapella_url') as string) || null
  const instrumental_url = normalizeMediaUrl(formData.get('instrumental_url') as string) || null

  if (!name || name.length < 2) {
    return { error: 'El nombre del producto es obligatorio.' }
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `product-${Date.now()}`

  const productPayload: Record<string, unknown> = {
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
  }

  const supabase = await createClient()
  let { error } = await supabase.from('products').insert(productPayload)

  if (error && (error.message.includes('column') || error.code === '42703')) {
    const safePayload = {
      slug,
      name,
      description,
      category,
      fulfillment,
      price_cents,
      currency: 'USD',
      thumbnail_url,
      audio_preview_url: mp3_url || wav_url,
      is_published: true,
      is_featured: true,
      specs: {
        mp3_url: mp3_url || undefined,
        wav_url: wav_url || undefined,
        video_url: video_url || undefined,
      },
    }
    const retry = await supabase.from('products').insert(safePayload)
    error = retry.error
  }

  if (error) {
    return { error: error.message || 'Error al guardar el producto.' }
  }

  revalidatePath('/shop')
  revalidatePath('/admin')
  revalidatePath('/admin/products')
  redirect('/admin/products?created=1')
}

/**
 * Actualizar producto existente (ej. cambiar precio a $0.99).
 */
export async function updateProduct(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin()

  const id = String(formData.get('id') ?? '').trim()
  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const category = String(formData.get('category') ?? 'music').trim()
  const fulfillment = String(formData.get('fulfillment') ?? 'digital').trim()
  const price_cents = Math.round(Number(formData.get('price') || 0) * 100)
  const thumbnail_url = normalizeMediaUrl(formData.get('thumbnail_url') as string) || null
  const mp3_url = normalizeMediaUrl(formData.get('mp3_url') as string) || null
  const wav_url = normalizeMediaUrl(formData.get('wav_url') as string) || null

  if (!id || !name) {
    return { error: 'ID y Nombre de producto son obligatorios.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({
      name,
      description,
      category,
      fulfillment,
      price_cents,
      thumbnail_url,
      mp3_url,
      wav_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { error: error.message || 'No se pudo actualizar el producto.' }
  }

  revalidatePath('/shop')
  revalidatePath(`/shop/${id}`)
  revalidatePath('/admin')
  revalidatePath('/admin/products')
  return { success: 'Producto actualizado exitosamente.' }
}

/**
 * Eliminar producto.
 */
export async function deleteProduct(formData: FormData): Promise<void> {
  await requireAdmin()

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return

  const supabase = await createClient()
  await supabase.from('products').delete().eq('id', id)

  revalidatePath('/shop')
  revalidatePath('/admin')
  revalidatePath('/admin/products')
  redirect('/admin/products')
}
