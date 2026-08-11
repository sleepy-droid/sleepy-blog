'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'

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
  const linkedProductId = String(formData.get('linked_product_id') ?? '').trim()
  const rawTags = String(formData.get('tags') ?? '').trim()
  const rawYoutubeUrl = String(formData.get('youtube_url') ?? '').trim()

  if (title.length < 3 || title.length > 150) {
    return { error: 'El título debe tener entre 3 y 150 caracteres.' }
  }
  if (body.length < 5 || body.length > 5000) {
    return { error: 'El contenido debe tener entre 5 y 5000 caracteres.' }
  }

  const tags = rawTags ? rawTags.split(',').map((t) => t.trim()).filter(Boolean) : []
  const embedYoutube = rawYoutubeUrl ? extractYouTubeEmbedUrl(rawYoutubeUrl) : null

  const supabase = await createClient()

  const insertData: Record<string, unknown> = {
    author_id: user.id,
    title,
    body,
    image_url: imageUrl || null,
    linked_product_id: linkedProductId || null,
    tags,
    youtube_url: embedYoutube || rawYoutubeUrl || null,
    status: 'visible',
    upvotes: 1,
  }

  const { error } = await supabase.from('forum_threads').insert(insertData)

  if (error) {
    return { error: error.message || 'No se pudo crear el hilo en el foro.' }
  }

  revalidatePath('/community')
  revalidatePath('/')
  revalidatePath('/admin')
  return { success: 'Hilo publicado exitosamente en el foro.' }
}
