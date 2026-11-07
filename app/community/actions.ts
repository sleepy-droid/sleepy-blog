'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { recordTelemetryEvent } from '@/lib/telemetry'

export type ThreadActionState = {
  error?: string
  success?: string
}

/** Helper function to convert standard YouTube links into embed URLs */
function extractYouTubeEmbedUrl(urlStr: string): string | null {
  if (!urlStr) return null
  try {
    const url = new URL(urlStr)
    let videoId = ''
    if (url.hostname.includes('youtube.com')) {
      videoId = url.searchParams.get('v') || ''
    } else if (url.hostname.includes('youtu.be')) {
      videoId = url.pathname.slice(1)
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  } catch {
    return null
  }
}

export async function createForumThread(
  _prev: ThreadActionState,
  formData: FormData
): Promise<ThreadActionState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión para publicar un hilo en el foro.' }
  }

  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const imageUrl = String(formData.get('image_url') ?? '').trim()
  const rawTags = String(formData.get('tags') ?? '').trim()
  const rawYoutubeUrl = String(formData.get('youtube_url') ?? '').trim()

  // Recoger hasta 3 productos etiquetados
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

  if (title.length < 3 || title.length > 150) {
    return { error: 'El título debe tener entre 3 y 150 caracteres.' }
  }
  if (body.length < 5 || body.length > 5000) {
    return { error: 'El contenido debe tener entre 5 y 5000 caracteres.' }
  }

  const cleanUserTags = rawTags
    ? rawTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => Boolean(t) && !t.startsWith('__prod:'))
    : []

  // Guardamos también los hasta 3 productIds como marcadores internos en tags para 100% de compatibilidad
  const productTagMarkers = productIds.map((pid) => `__prod:${pid}`)
  const combinedTags = [...cleanUserTags, ...productTagMarkers]

  const embedYoutube = rawYoutubeUrl ? extractYouTubeEmbedUrl(rawYoutubeUrl) : null

  const supabase = await createClient()

  const insertData: Record<string, unknown> = {
    author_id: user.id,
    title,
    body,
    image_url: imageUrl || null,
    linked_product_id: productIds[0] || null,
    product_ids: productIds,
    tags: combinedTags,
    youtube_url: embedYoutube || rawYoutubeUrl || null,
    status: 'visible',
    upvotes: 0,
    downvotes: 0,
  }

  let { data, error } = await supabase
    .from('forum_threads')
    .insert(insertData)
    .select('id')
    .single()

    // Fallback si la columna product_ids o downvotes aún no está en el caché de esquema
    if (error && (error.message.includes('product_ids') || error.message.includes('downvotes') || error.message.includes('column'))) {
      delete insertData.product_ids
      delete insertData.downvotes
      const retry = await supabase
        .from('forum_threads')
        .insert(insertData)
        .select('id')
        .single()
      data = retry.data
      error = retry.error
    }

    if (error || !data) {
      return { error: error?.message || 'No se pudo crear el hilo en el foro.' }
    }

    recordTelemetryEvent({
      eventType: 'forum_thread_created',
      targetType: 'forum_thread',
      targetId: data.id,
      userId: user.id,
      metadata: {
        title,
        tagged_products_count: productIds.length,
        product_ids: productIds,
      },
    }).catch(() => { })

    revalidatePath('/community')
    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath('/admin/community')
    redirect(`/community/${data.id}`)
  }

  /**
   * Permite al autor de un hilo del foro (o a un administrador) eliminar su propio hilo.
   * Actualiza primero `status = 'deleted'` (compatible con la política RLS `forum_threads_update_own`)
   * y ejecuta también `DELETE` directo sobre la fila.
   */
  export async function deleteOwnForumThread(
    threadId: string
  ): Promise<{ ok: boolean; error?: string }> {
    const cleanId = String(threadId ?? '').trim()
    if (!cleanId) {
      return { ok: false, error: 'ID de hilo inválido.' }
    }

    const user = await getCurrentUser()
    if (!user) {
      return { ok: false, error: 'Debes iniciar sesión.' }
    }

    const supabase = await createClient()

    const { data: thread } = await supabase
      .from('forum_threads')
      .select('id, author_id')
      .eq('id', cleanId)
      .maybeSingle()

    if (!thread) {
      return { ok: false, error: 'El hilo ya no existe.' }
    }

    if (thread.author_id !== user.id && !user.isAdmin) {
      return { ok: false, error: 'Solo el autor o un administrador puede eliminar este hilo.' }
    }

    // 1. Soft-delete inmediato garantizado por RLS (forum_threads_update_own permite UPDATE a author_id o admin)
    const { error: updateErr } = await supabase
      .from('forum_threads')
      .update({ status: 'deleted' })
      .eq('id', cleanId)

    // 2. Intentar también borrado físico en caso de que la política FOR DELETE esté activa
    await supabase.from('forum_threads').delete().eq('id', cleanId)

    if (updateErr) {
      return { ok: false, error: updateErr.message || 'No se pudo eliminar el hilo.' }
    }

    revalidatePath('/community')
    revalidatePath(`/community/${cleanId}`)
    revalidatePath('/admin')
    revalidatePath('/admin/community')

    return { ok: true }
  }
