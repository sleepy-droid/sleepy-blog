import type { SupabaseClient } from '@supabase/supabase-js'
import type { Comment, CommentWithAuthor, Profile } from './types'

type AuthorPreview = Pick<Profile, 'display_name' | 'email' | 'avatar_url' | 'username'>

export type AdminModerationItem = CommentWithAuthor & {
  item_source: 'comment' | 'profile_feed'
  target_label?: string
  target_href?: string
}

/**
 * Carga comentarios e hidrata los perfiles de autor mediante consulta por lotes (`in('id', userIds)`).
 * Esto evita errores de PostgREST cuando `comments.user_id` referencia `auth.users(id)` en lugar de `public.profiles(id)`.
 */
export async function fetchCommentsWithProfiles(params: {
  supabase: SupabaseClient
  targetId?: string
  includeHidden?: boolean
  limit?: number
}): Promise<CommentWithAuthor[]> {
  const { supabase, targetId, includeHidden = false, limit = 200 } = params

  try {
    let query = supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (targetId) {
      query = query.or(`target_id.eq.${targetId},post_id.eq.${targetId}`)
    }

    const { data: rawComments, error } = await query
    if (error || !rawComments || rawComments.length === 0) {
      return []
    }

    const filtered = includeHidden
      ? (rawComments as Comment[])
      : (rawComments as Comment[]).filter(
          (c) => !c.status || c.status === 'visible'
        )

    if (filtered.length === 0) return []

    const userIds = Array.from(
      new Set(filtered.map((c) => c.user_id).filter(Boolean))
    )

    const profileMap = new Map<string, AuthorPreview>()
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, display_name, email, avatar_url, username')
        .in('id', userIds)

      if (profilesData) {
        for (const p of profilesData) {
          profileMap.set(p.id, {
            display_name: p.display_name,
            email: p.email,
            avatar_url: p.avatar_url,
            username: p.username,
          })
        }
      }
    }

    return filtered.map((c) => ({
      ...c,
      profiles: profileMap.get(c.user_id) || null,
    }))
  } catch {
    return []
  }
}

/**
 * Obtiene TODOS los comentarios (Posts, Productos, Foro, Perfiles) y todas las publicaciones de muros de perfil (`profile_updates`)
 * ordenados de más reciente a más antiguo para la moderación matutina del Super-Usuario.
 */
export async function fetchAllModerationItems(
  supabase: SupabaseClient
): Promise<AdminModerationItem[]> {
  try {
    const [
      { data: rawComments },
      { data: rawUpdates },
      { data: postsData },
      { data: productsData },
      { data: threadsData },
      { data: allProfiles },
    ] = await Promise.all([
      supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('profile_updates').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('posts').select('id, title'),
      supabase.from('products').select('id, slug, name'),
      supabase.from('forum_threads').select('id, title'),
      supabase.from('profiles').select('id, display_name, email, avatar_url, username'),
    ])

    const profileMap = new Map<string, AuthorPreview>()
    if (allProfiles) {
      for (const p of allProfiles) {
        profileMap.set(p.id, {
          display_name: p.display_name,
          email: p.email,
          avatar_url: p.avatar_url,
          username: p.username,
        })
      }
    }

    const postMap = new Map<string, string>()
    for (const p of postsData || []) {
      postMap.set(p.id, p.title)
    }

    const productMap = new Map<string, { name: string; slug: string }>()
    for (const pr of productsData || []) {
      productMap.set(pr.id, { name: pr.name, slug: pr.slug || pr.id })
    }

    const threadMap = new Map<string, string>()
    for (const t of threadsData || []) {
      threadMap.set(t.id, t.title)
    }

    const items: AdminModerationItem[] = []

    for (const c of (rawComments || []) as Comment[]) {
      const targetId = c.target_id || c.post_id || ''
      const tType = c.target_type || (c.post_id ? 'post' : 'product')
      let target_label = 'Publicación'
      let target_href = targetId ? `/posts/${targetId}` : '/'

      if (tType === 'post') {
        target_label = `Post: ${postMap.get(targetId) || `#${targetId.slice(0, 6)}`}`
        target_href = `/posts/${targetId}`
      } else if (tType === 'product') {
        const prod = productMap.get(targetId)
        target_label = `Producto: ${prod?.name || `#${targetId.slice(0, 6)}`}`
        target_href = `/shop/${prod?.slug || targetId}`
      } else if (tType === 'forum_thread') {
        target_label = `Foro: ${threadMap.get(targetId) || `#${targetId.slice(0, 6)}`}`
        target_href = `/community/${targetId}`
      } else if (tType === 'profile_update') {
        const targetProf = profileMap.get(targetId)
        const uname = targetProf?.username || targetProf?.display_name || targetId.slice(0, 6)
        target_label = `Muro de @${uname}`
        target_href = `/u/${targetProf?.username || targetId}`
      }

      items.push({
        ...c,
        profiles: profileMap.get(c.user_id) || null,
        item_source: 'comment',
        target_label,
        target_href,
      })
    }

    for (const u of rawUpdates || []) {
      const authorProf = profileMap.get(u.user_id) || null
      const uname = authorProf?.username || authorProf?.display_name || u.user_id?.slice(0, 6) || 'user'
      const isSongMood = typeof u.body === 'string' && u.body.startsWith('[FAVORITE_SONG_CHANGED]:')
      let displayBody = u.body
      if (isSongMood) {
        const rawPayload = u.body.replace('[FAVORITE_SONG_CHANGED]:', '').trim()
        const [songPart, captionPart] = rawPayload.split('||')
        displayBody = captionPart
          ? `🔥 Canción Mood del Día (${songPart}): "${captionPart}"`
          : `🔥 Compartió Canción Mood del Día: ${songPart}`
      }

      items.push({
        id: u.id,
        user_id: u.user_id,
        body: displayBody,
        target_type: 'profile_update',
        target_id: u.user_id,
        status: u.status || 'visible',
        created_at: u.created_at,
        updated_at: u.created_at,
        profiles: authorProf,
        item_source: 'profile_feed',
        target_label: `Feed de Perfil @${uname}`,
        target_href: `/u/${uname}`,
      })
    }

    items.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return items
  } catch {
    return []
  }
}
