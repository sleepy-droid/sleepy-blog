import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { hydrateProductWithFolderAssets } from '@/lib/product-files'
import type { Product } from '@/lib/types'
import { ProfileEditForm, type UnlockedArtworkOption } from './ProfileEditForm'
import {
  getSongById,
  SONG_PRESETS,
  type SongPreset,
} from '@/lib/profile-presets'
import {
  ProfileActivityFeed,
  type ActivityItem,
} from '@/components/profile/ProfileActivityFeed'

export default async function ProfilePage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect('/auth/login?next=/profile')
  }

  const supabase = await createClient()

  // Cargar perfil del usuario actual
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single()

  // Cargar ÚNICAMENTE las canciones publicadas actualmente en la tienda para el selector de Canción Favorita
  const { data: dbMusicProducts } = await supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .or('category.eq.music,fulfillment.eq.digital')
    .order('created_at', { ascending: false })

  const availableSongs: SongPreset[] = []
  const productUuidToSlugMap = new Map<string, string>()

    if (dbMusicProducts && dbMusicProducts.length > 0) {
      for (const rawP of dbMusicProducts) {
        const p = hydrateProductWithFolderAssets(rawP as Product)
        const songKey = p.slug || p.id
        if (p.id && songKey) {
          productUuidToSlugMap.set(p.id, songKey)
        }
        const audioUrl = p.audio_preview_url || p.mp3_url || p.wav_url
        if (!audioUrl) continue
        const existingIdx = availableSongs.findIndex(
          (s) => s.id === songKey || s.id === p.id
        )
        const hydratedSong: SongPreset = {
          id: songKey,
          productId: p.id,
          title: p.name,
          artist: 'sleepyred999',
          subtitle: p.description?.slice(0, 48) || 'Lanzamiento Oficial',
          audioPreviewUrl: audioUrl,
          thumbnailUrl: p.thumbnail_url || '/images/logos/PNG-04.png',
          durationSeconds: 30,
          priceCents:
            typeof p.price_cents === 'number' && p.price_cents > 0
              ? p.price_cents
              : 99,
        }
        if (existingIdx === -1) {
          availableSongs.push(hydratedSong)
        } else {
          availableSongs[existingIdx] = {
            ...availableSongs[existingIdx],
            ...hydratedSong,
          }
        }
      }
    }

    // Solo si la tabla products estuviera completamente vacía usar los presets reales de respaldo
    if (availableSongs.length === 0) {
      availableSongs.push(...SONG_PRESETS)
    }

    const resolveSong = (songId?: string | null): SongPreset => {
      if (!songId) return availableSongs[0]
      const mappedKey = productUuidToSlugMap.get(songId) || songId
      return (
        availableSongs.find((s) => s.id === mappedKey || s.id === songId) ||
        getSongById(mappedKey, availableSongs)
      )
    }

    const name = profile?.display_name || currentUser.email?.split('@')[0] || 'Miembro'
    const username = profile?.username || currentUser.email?.split('@')[0] || 'user'
    const avatarUrl = profile?.avatar_url || '/images/avatars/emblem-obsidian-crest.svg'

    // Actividades del usuario para el feed
    const activities: ActivityItem[] = []

    const { data: updates } = await supabase
      .from('profile_updates')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (updates && updates.length > 0) {
      for (const u of updates) {
        if (u.status === 'deleted') continue
        if (u.body.startsWith('[FAVORITE_SONG_CHANGED]:')) {
          const rawPayload = u.body.replace('[FAVORITE_SONG_CHANGED]:', '').trim()
          const [songIdPart, captionPart] = rawPayload.split('||')
          const song = resolveSong(songIdPart)
          activities.push({
            id: u.id,
            type: 'favorite_song_changed',
            itemSource: 'profile_update',
            authorId: u.user_id,
            moodSongId: song.id,
            body: captionPart || undefined,
            targetTitle: song.title,
            audioPreviewUrl: song.audioPreviewUrl,
            createdAt: u.created_at,
          })
        } else {
          activities.push({
            id: u.id,
            type: 'note',
            itemSource: 'profile_update',
            authorId: u.user_id,
            body: u.body,
            createdAt: u.created_at,
          })
        }
      }
    }

    const { data: comments } = await supabase
      .from('comments')
      .select('id, user_id, body, created_at, post_id, target_type, target_id, status')
      .or(`user_id.eq.${currentUser.id},and(target_type.eq.profile_update,target_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (comments && comments.length > 0) {
      const wallAuthorIds = Array.from(
        new Set(
          comments
            .filter((c) => c.user_id && c.user_id !== currentUser.id)
            .map((c) => c.user_id)
        )
      )
      const wallAuthorsMap = new Map<string, { display_name?: string | null; username?: string | null }>()
      if (wallAuthorIds.length > 0) {
        const { data: wallProfs } = await supabase
          .from('profiles')
          .select('id, display_name, username')
          .in('id', wallAuthorIds)
        for (const wp of wallProfs || []) {
          wallAuthorsMap.set(wp.id, wp)
        }
      }

      for (const c of comments) {
        if (c.status === 'deleted') continue
        if (c.target_type === 'profile_update' && c.target_id === currentUser.id && c.user_id !== currentUser.id) {
          const wp = wallAuthorsMap.get(c.user_id)
          activities.push({
            id: c.id,
            type: 'wall_comment',
            itemSource: 'comment',
            authorId: c.user_id,
            authorName: wp?.display_name || wp?.username || 'Miembro',
            authorUsername: wp?.username || 'user',
            body: c.body,
            createdAt: c.created_at,
          })
        } else {
          let targetTitle = 'Publicación'
          let targetHref: string | undefined = c.post_id ? `/posts/${c.post_id}` : undefined
          if (c.target_type === 'product' && c.target_id) {
            targetTitle = 'Producto de Tienda'
            targetHref = `/shop/${c.target_id}`
          } else if (c.target_type === 'forum_thread' && c.target_id) {
            targetTitle = 'Hilo de Comunidad'
            targetHref = `/community/${c.target_id}`
          }
          activities.push({
            id: c.id,
            type: 'comment',
            itemSource: 'comment',
            authorId: c.user_id,
            targetTitle,
            targetHref,
            body: c.body,
            createdAt: c.created_at,
          })
        }
      }
    }

    const { data: libraryItems } = await supabase
      .from('library_items')
      .select('id, created_at, products (*)')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    const unlockedArtworks: UnlockedArtworkOption[] = []
    const unlockedProductIds = new Set<string>()
    const seenArtUrls = new Set<string>()

    if (libraryItems && libraryItems.length > 0) {
      for (const lib of libraryItems) {
        const rawProd = (Array.isArray(lib.products) ? lib.products[0] : lib.products) as Product | null
        const prodName = rawProd?.name || 'Lanzamiento digital'
        activities.push({
          id: lib.id,
          type: 'purchase',
          targetTitle: prodName,
          createdAt: lib.created_at,
        })

        if (rawProd) {
          const hydrated = hydrateProductWithFolderAssets(rawProd)
          unlockedProductIds.add(hydrated.id)
          if (hydrated.slug) unlockedProductIds.add(hydrated.slug)
          const coverUrl = hydrated.thumbnail_url
          if (coverUrl && !seenArtUrls.has(coverUrl)) {
            seenArtUrls.add(coverUrl)
            unlockedArtworks.push({
              id: hydrated.id,
              title: hydrated.name,
              url: coverUrl,
              isUnlocked: true,
            })
          }
        }
      }
    }

    // Agregar también las portadas del catálogo publicado (desbloqueadas para Admin, o marcadas según biblioteca)
    if (dbMusicProducts) {
      for (const rawP of dbMusicProducts) {
        const hydrated = hydrateProductWithFolderAssets(rawP as Product)
        const coverUrl = hydrated.thumbnail_url
        if (coverUrl && !seenArtUrls.has(coverUrl)) {
          seenArtUrls.add(coverUrl)
          const isUnlockedForUser =
            Boolean(currentUser.isAdmin) ||
            unlockedProductIds.has(hydrated.id) ||
            (hydrated.slug ? unlockedProductIds.has(hydrated.slug) : false)
          unlockedArtworks.push({
            id: hydrated.id,
            title: hydrated.name,
            url: coverUrl,
            isUnlocked: isUnlockedForUser,
          })
        }
      }
    }

    activities.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return (
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
        {/* Interactive Facebook-Style Profile Showcase & 1-Click Steam/Dota 2 Customizer */}
        <ProfileEditForm
          profile={profile}
          availableSongs={availableSongs}
          unlockedArtworks={unlockedArtworks}
          isAdmin={Boolean(currentUser.isAdmin)}
          fallbackEmail={currentUser.email}
        />

        {/* Feed de Actividad del Usuario */}
        <ProfileActivityFeed
          userId={currentUser.id}
          username={username}
          displayName={name}
          avatarUrl={avatarUrl}
          isOwner={true}
          isAdmin={Boolean(currentUser.isAdmin)}
          currentUserId={currentUser.id}
          currentUserName={name}
          currentUserAvatar={avatarUrl}
          availableSongs={availableSongs}
          activities={activities}
        />
      </main>
    )
  }
