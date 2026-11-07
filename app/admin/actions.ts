'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/auth'
import {
  normalizeMediaUrl,
  encodePostContentWithProducts,
  stripPostProductsMarker,
} from '@/lib/utils'
import { provisionProductDirectoryAndUpload, hydrateProductWithFolderAssets } from '@/lib/product-files'
import type { Product } from '@/lib/types'

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
  const rawContent = String(formData.get('content') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim() || 'General'

  // Soportar hasta 3 productos etiquetados en una publicación pública
  const multiIds = formData
    .getAll('linked_product_ids')
    .map((v) => String(v).trim())
    .filter(Boolean)
  const csvIds = String(formData.get('linked_product_ids_csv') ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  const singleId = String(formData.get('linked_product_id') ?? '').trim()

  const productIds = Array.from(
    new Set([...multiIds, ...csvIds, ...(singleId ? [singleId] : [])])
  ).slice(0, 3)

  const linked_product_id = productIds[0] || null
  const cleanContent = stripPostProductsMarker(rawContent)
  const content = encodePostContentWithProducts(cleanContent, productIds)

  let image_url = normalizeMediaUrl(formData.get('image_url') as string) || null
  let media_url = normalizeMediaUrl(formData.get('media_url') as string) || null
  let price = parsePrice(formData.get('price'))

  if (!title || title.length < 2) {
    return { error: 'El título es obligatorio (mín. 2 caracteres).' }
  }
    if (!cleanContent || cleanContent.length < 2) {
      return { error: 'El contenido es obligatorio.' }
    }

    const supabase = await createClient()

    if (linked_product_id && (!image_url || !media_url || !price)) {
      const { data: linkedProd } = await supabase
        .from('products')
        .select('thumbnail_url, mp3_url, wav_url, audio_preview_url, price_cents')
        .eq('id', linked_product_id)
        .maybeSingle()

      if (linkedProd) {
        if (!image_url && linkedProd.thumbnail_url) {
          image_url = normalizeMediaUrl(linkedProd.thumbnail_url) || null
        }
        if (!media_url) {
          const prodAudio = linkedProd.audio_preview_url || linkedProd.mp3_url || linkedProd.wav_url
          if (prodAudio) media_url = normalizeMediaUrl(prodAudio) || null
        }
        if (!price && typeof linkedProd.price_cents === 'number' && linkedProd.price_cents > 0) {
          price = Number((linkedProd.price_cents / 100).toFixed(2))
        }
      }
    }

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
    const rawContent = String(formData.get('content') ?? '').trim()
    const category = String(formData.get('category') ?? '').trim() || 'General'

    const multiIds = formData
      .getAll('linked_product_ids')
      .map((v) => String(v).trim())
      .filter(Boolean)
    const csvIds = String(formData.get('linked_product_ids_csv') ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
    const singleId = String(formData.get('linked_product_id') ?? '').trim()

    const productIds = Array.from(
      new Set([...multiIds, ...csvIds, ...(singleId ? [singleId] : [])])
    ).slice(0, 3)

    const linked_product_id = productIds[0] || null
    const cleanContent = stripPostProductsMarker(rawContent)
    const content = encodePostContentWithProducts(cleanContent, productIds)

    let image_url = normalizeMediaUrl(formData.get('image_url') as string) || null
    let media_url = normalizeMediaUrl(formData.get('media_url') as string) || null
    let price = parsePrice(formData.get('price'))

    if (!id) return { error: 'ID de publicación inválido.' }
      if (!title || !cleanContent) {
        return { error: 'Título y contenido son obligatorios.' }
      }

      const supabase = await createClient()

      if (linked_product_id && (!image_url || !media_url || !price)) {
        const { data: linkedProd } = await supabase
          .from('products')
          .select('thumbnail_url, mp3_url, wav_url, audio_preview_url, price_cents')
          .eq('id', linked_product_id)
          .maybeSingle()

        if (linkedProd) {
          if (!image_url && linkedProd.thumbnail_url) {
            image_url = normalizeMediaUrl(linkedProd.thumbnail_url) || null
          }
          if (!media_url) {
            const prodAudio = linkedProd.audio_preview_url || linkedProd.mp3_url || linkedProd.wav_url
            if (prodAudio) media_url = normalizeMediaUrl(prodAudio) || null
          }
          if (!price && typeof linkedProd.price_cents === 'number' && linkedProd.price_cents > 0) {
            price = Number((linkedProd.price_cents / 100).toFixed(2))
          }
        }
      }

      const updatePayload: Record<string, unknown> = {
        title,
        content,
        category,
        image_url,
        cover_url: image_url,
        media_url,
        price,
      }

      updatePayload.linked_product_id = linked_product_id

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
     * Actualizar comentario o nota de perfil desde el panel admin.
     */
    export async function adminUpdateComment(formData: FormData): Promise<void> {
      await requireAdmin()

      const id = String(formData.get('id') ?? '').trim()
      const body = String(formData.get('body') ?? '').trim()
      const postId = String(formData.get('post_id') ?? '').trim()
      const itemSource = String(formData.get('item_source') ?? 'comment').trim()

      if (!id || body.length < 1) return

      const supabase = await createClient()
      if (itemSource === 'profile_feed') {
        await supabase
          .from('profile_updates')
          .update({ body })
          .eq('id', id)
      } else {
        await supabase
          .from('comments')
          .update({ body, updated_at: new Date().toISOString() })
          .eq('id', id)
      }

      if (postId) revalidatePath(`/posts/${postId}`)
      revalidatePath('/profile')
      revalidatePath('/admin')
      revalidatePath('/admin/comments')
    }

    /**
     * Ocultar comentario o nota de perfil (moderación suave para spam).
     */
    export async function adminHideComment(formData: FormData): Promise<void> {
      const admin = await requireAdmin()

      const id = String(formData.get('id') ?? '').trim()
      const postId = String(formData.get('post_id') ?? '').trim()
      const targetId = String(formData.get('target_id') ?? postId).trim()
      const itemSource = String(formData.get('item_source') ?? 'comment').trim()
      if (!id) return

      const supabase = await createClient()
      if (itemSource === 'profile_feed') {
        await supabase
          .from('profile_updates')
          .update({ status: 'hidden' })
          .eq('id', id)
      } else {
        await supabase
          .from('comments')
          .update({
            status: 'hidden',
            hidden_at: new Date().toISOString(),
            hidden_by: admin.id,
          })
          .eq('id', id)
      }

      if (targetId) revalidatePath(`/posts/${targetId}`)
      if (targetId) revalidatePath(`/shop/${targetId}`)
      revalidatePath('/profile')
      revalidatePath('/admin')
      revalidatePath('/admin/comments')
    }

    /**
     * Restablecer comentario o nota de perfil a visible.
     */
    export async function adminRestoreComment(formData: FormData): Promise<void> {
      await requireAdmin()

      const id = String(formData.get('id') ?? '').trim()
      const postId = String(formData.get('post_id') ?? '').trim()
      const targetId = String(formData.get('target_id') ?? postId).trim()
      const itemSource = String(formData.get('item_source') ?? 'comment').trim()
      if (!id) return

      const supabase = await createClient()
      if (itemSource === 'profile_feed') {
        await supabase
          .from('profile_updates')
          .update({ status: 'visible' })
          .eq('id', id)
      } else {
        await supabase
          .from('comments')
          .update({
            status: 'visible',
            hidden_at: null,
            hidden_by: null,
          })
          .eq('id', id)
      }

      if (targetId) revalidatePath(`/posts/${targetId}`)
      if (targetId) revalidatePath(`/shop/${targetId}`)
      revalidatePath('/profile')
      revalidatePath('/admin')
      revalidatePath('/admin/comments')
    }

    /**
     * Eliminar comentario o nota de perfil permanentemente desde admin.
     */
    export async function adminDeleteComment(formData: FormData): Promise<void> {
      await requireAdmin()

      const id = String(formData.get('id') ?? '').trim()
      const postId = String(formData.get('post_id') ?? '').trim()
      const targetId = String(formData.get('target_id') ?? postId).trim()
      const itemSource = String(formData.get('item_source') ?? 'comment').trim()
      if (!id) return

      const supabase = await createClient()
      if (itemSource === 'profile_feed') {
        await supabase.from('profile_updates').delete().eq('id', id)
      } else {
        await supabase.from('comments').delete().eq('id', id)
      }

      if (targetId) revalidatePath(`/posts/${targetId}`)
      if (targetId) revalidatePath(`/shop/${targetId}`)
      revalidatePath('/profile')
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
     * Moderar hilos del foro desde admin (Alternar Oculto/Visible y Eliminar hilos).
     */
    export async function adminHideThread(formData: FormData): Promise<void> {
      await requireAdmin()
      const id = String(formData.get('id') ?? '').trim()
      const currentStatus = String(formData.get('current_status') ?? 'visible').trim()
      if (!id) return

      const nextStatus = currentStatus === 'hidden' ? 'visible' : 'hidden'

      const supabase = await createClient()
      await supabase.from('forum_threads').update({ status: nextStatus }).eq('id', id)
      revalidatePath('/admin')
      revalidatePath('/admin/community')
      revalidatePath('/community')
      revalidatePath(`/community/${id}`)
    }

    export async function adminDeleteThread(formData: FormData): Promise<void> {
      await requireAdmin()
      const id = String(formData.get('id') ?? '').trim()
      if (!id) return

      const supabase = await createClient()
      // 1. Marcar como eliminado (soft-delete garantizado por la política UPDATE de RLS)
      await supabase.from('forum_threads').update({ status: 'deleted' }).eq('id', id)
      // 2. Ejecutar también borrado físico en caso de que la política FOR DELETE esté activa
      await supabase.from('forum_threads').delete().eq('id', id)

      revalidatePath('/admin')
      revalidatePath('/admin/community')
      revalidatePath('/community')
      revalidatePath(`/community/${id}`)
    }

    /**
     * Crear producto en el catálogo (solo admin).
     * Provisiona automáticamente la carpeta del producto (`public/songs/<slug>` o `public/merch/<slug>`)
     * y sincroniza los archivos subidos con el sistema de archivos / Supabase Storage CDN.
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

      if (!name || name.length < 2) {
        return { error: 'El nombre del producto es obligatorio.' }
      }

      const customSlug = String(formData.get('slug') ?? '').trim()
      const slug = (customSlug || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || `product-${Date.now()}`

      const supabase = await createClient()

      // Provisionar carpeta automática del producto y guardar archivos subidos
      const uploaded = await provisionProductDirectoryAndUpload({
        slug,
        name,
        category,
        fulfillment,
        formData,
        supabase,
      })

      const rawThumbnailUrl =
        uploaded.thumbnail_url ||
        normalizeMediaUrl(formData.get('thumbnail_url') as string) ||
        null
      const rawMp3Url =
        uploaded.mp3_url ||
        normalizeMediaUrl(formData.get('mp3_url') as string) ||
        null
      const rawWavUrl =
        uploaded.wav_url ||
        normalizeMediaUrl(formData.get('wav_url') as string) ||
        null
      const video_url = String(formData.get('video_url') ?? '').trim() || null
      const rawAcapellaUrl =
        uploaded.acapella_url ||
        normalizeMediaUrl(formData.get('acapella_url') as string) ||
        null
      const rawInstrumentalUrl =
        uploaded.instrumental_url ||
        normalizeMediaUrl(formData.get('instrumental_url') as string) ||
        null

      const specsObj: Record<string, unknown> = {
        folder: `/${uploaded.folderRelativePath}`,
      }
      if (uploaded.files && uploaded.files.length > 0) {
        specsObj.files = uploaded.files
      }
      if (uploaded.wav_urls && uploaded.wav_urls.length > 0) {
        specsObj.wav_urls = uploaded.wav_urls
      }
      if (uploaded.mp3_urls && uploaded.mp3_urls.length > 0) {
        specsObj.mp3_urls = uploaded.mp3_urls
      }
      if (uploaded.cover_urls && uploaded.cover_urls.length > 0) {
        specsObj.cover_urls = uploaded.cover_urls
      }
      if (uploaded.acapella_urls && uploaded.acapella_urls.length > 0) {
        specsObj.acapella_urls = uploaded.acapella_urls
      }
      if (uploaded.instrumental_urls && uploaded.instrumental_urls.length > 0) {
        specsObj.instrumental_urls = uploaded.instrumental_urls
      }

      const hydratedDraft = hydrateProductWithFolderAssets({
        id: slug,
        slug,
        name,
        description,
        category: category as Product['category'],
        fulfillment: fulfillment as Product['fulfillment'],
        price_cents,
        currency: 'USD',
        thumbnail_url: rawThumbnailUrl,
        mp3_url: rawMp3Url,
        wav_url: rawWavUrl,
        audio_preview_url: rawMp3Url || rawWavUrl,
        acapella_url: rawAcapellaUrl,
        instrumental_url: rawInstrumentalUrl,
        storage_folder_path: uploaded.folderRelativePath,
        specs: specsObj,
        is_published: true,
        is_featured: true,
        created_at: new Date().toISOString(),
      } as Product)

      const thumbnail_url = hydratedDraft.thumbnail_url
      const mp3_url = hydratedDraft.mp3_url
      const wav_url = hydratedDraft.wav_url
      const acapella_url = hydratedDraft.acapella_url
      const instrumental_url = hydratedDraft.instrumental_url

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
        storage_folder_path: uploaded.folderRelativePath,
        audio_preview_url: mp3_url || wav_url,
        specs: specsObj,
        is_published: true,
        is_featured: true,
      }

      let { error } = await supabase.from('products').insert(productPayload)

      // Si aún no se ha corrido schema_v6 (storage_folder_path), reintentar sin storage_folder_path
      if (error && error.message.includes('storage_folder_path')) {
        delete productPayload.storage_folder_path
        const retryV5 = await supabase.from('products').insert(productPayload)
        error = retryV5.error
      }

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
            folder: `/${uploaded.folderRelativePath}`,
            mp3_url: mp3_url || undefined,
            wav_url: wav_url || undefined,
            video_url: video_url || undefined,
            acapella_url: acapella_url || undefined,
            instrumental_url: instrumental_url || undefined,
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
     * Actualizar producto existente y sincronizar archivos nuevos en la carpeta del producto.
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

      if (!id || !name) {
        return { error: 'ID y Nombre de producto son obligatorios.' }
      }

      const supabase = await createClient()

      const { data: existing } = await supabase
        .from('products')
        .select('slug, specs')
        .eq('id', id)
        .maybeSingle()

      const slug =
        existing?.slug ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

      const uploaded = await provisionProductDirectoryAndUpload({
        slug,
        name,
        category,
        fulfillment,
        formData,
        supabase,
      })

      const rawThumbnailUrl =
        uploaded.thumbnail_url ||
        normalizeMediaUrl(formData.get('thumbnail_url') as string) ||
        null
      const rawMp3Url =
        uploaded.mp3_url ||
        normalizeMediaUrl(formData.get('mp3_url') as string) ||
        null
      const rawWavUrl =
        uploaded.wav_url ||
        normalizeMediaUrl(formData.get('wav_url') as string) ||
        null
      const video_url = String(formData.get('video_url') ?? '').trim() || null
      const rawAcapellaUrl =
        uploaded.acapella_url ||
        normalizeMediaUrl(formData.get('acapella_url') as string) ||
        null
      const rawInstrumentalUrl =
        uploaded.instrumental_url ||
        normalizeMediaUrl(formData.get('instrumental_url') as string) ||
        null

      const existingSpecs =
        existing?.specs && typeof existing.specs === 'object'
          ? (existing.specs as Record<string, unknown>)
          : {}
      const updatedSpecs: Record<string, unknown> = {
        ...existingSpecs,
        folder: `/${uploaded.folderRelativePath}`,
      }
      if (uploaded.files && uploaded.files.length > 0) {
        const prevFiles = Array.isArray(existingSpecs.files) ? existingSpecs.files : []
        const uploadedNames = new Set(uploaded.files.map((f) => f.name.toLowerCase()))
        updatedSpecs.files = [
          ...prevFiles.filter(
            (pf: { name?: string }) => !pf?.name || !uploadedNames.has(pf.name.toLowerCase())
          ),
          ...uploaded.files,
        ]
      }
      if (uploaded.wav_urls && uploaded.wav_urls.length > 0) {
        updatedSpecs.wav_urls = uploaded.wav_urls
      }
      if (uploaded.mp3_urls && uploaded.mp3_urls.length > 0) {
        updatedSpecs.mp3_urls = uploaded.mp3_urls
      }
      if (uploaded.cover_urls && uploaded.cover_urls.length > 0) {
        updatedSpecs.cover_urls = uploaded.cover_urls
      }
      if (uploaded.acapella_urls && uploaded.acapella_urls.length > 0) {
        updatedSpecs.acapella_urls = uploaded.acapella_urls
      }
      if (uploaded.instrumental_urls && uploaded.instrumental_urls.length > 0) {
        updatedSpecs.instrumental_urls = uploaded.instrumental_urls
      }

      const hydratedDraft = hydrateProductWithFolderAssets({
        id,
        slug,
        name,
        description,
        category: category as Product['category'],
        fulfillment: fulfillment as Product['fulfillment'],
        price_cents,
        currency: 'USD',
        thumbnail_url: rawThumbnailUrl,
        mp3_url: rawMp3Url,
        wav_url: rawWavUrl,
        audio_preview_url: rawMp3Url || rawWavUrl,
        acapella_url: rawAcapellaUrl,
        instrumental_url: rawInstrumentalUrl,
        storage_folder_path: uploaded.folderRelativePath,
        specs: updatedSpecs,
        is_published: true,
        is_featured: true,
        created_at: new Date().toISOString(),
      } as Product)

      const thumbnail_url = hydratedDraft.thumbnail_url
      const mp3_url = hydratedDraft.mp3_url
      const wav_url = hydratedDraft.wav_url
      const acapella_url = hydratedDraft.acapella_url
      const instrumental_url = hydratedDraft.instrumental_url

      const updatePayload: Record<string, unknown> = {
        name,
        description,
        category,
        fulfillment,
        price_cents,
        thumbnail_url,
        mp3_url,
        wav_url,
        video_url,
        acapella_url,
        instrumental_url,
        audio_preview_url: mp3_url || wav_url,
        specs: updatedSpecs,
        updated_at: new Date().toISOString(),
      }

      let { error } = await supabase
        .from('products')
        .update(updatePayload)
        .eq('id', id)

      if (error && (error.message.includes('column') || error.code === '42703')) {
        const basicPayload = {
          name,
          description,
          category,
          fulfillment,
          price_cents,
          thumbnail_url,
          mp3_url,
          wav_url,
          audio_preview_url: mp3_url || wav_url,
          updated_at: new Date().toISOString(),
        }
        const retry = await supabase.from('products').update(basicPayload).eq('id', id)
        error = retry.error
      }

      if (error) {
        return { error: error.message || 'No se pudo actualizar el producto.' }
      }

      revalidatePath('/shop')
      revalidatePath(`/shop/${id}`)
      revalidatePath(`/shop/${slug}`)
      revalidatePath('/admin')
      revalidatePath('/admin/products')
      return {
        success: `Producto actualizado y sincronizado en /${uploaded.folderRelativePath}.`,
      }
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
