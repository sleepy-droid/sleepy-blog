/**
 * Public User Profile Page: /u/[username]
 * File Path: app/u/[username]/page.tsx
 * 
 * Features:
 * 1. Dynamic profile for each user (no hardcoded sleepyred placeholder).
 * 2. Visual banner, custom avatar, bio and status update.
 * 3. Humanized "Canción Favorita" with interactive 30s audio snippet player.
 * 4. Groundwork for dopaminergic activity feed (Twitter-style notes, Gold Hue purchases, Fire Hue song updates).
 */

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { Calendar, ShieldCheck, Edit3 } from 'lucide-react'
import type { Metadata } from 'next'
import type { Profile } from '@/lib/types'
import { getSongById } from '@/lib/profile-presets'
import { FavoriteSongSnippetPlayer } from '@/components/profile/FavoriteSongSnippetPlayer'
import {
  ProfileActivityFeed,
  type ActivityItem,
} from '@/components/profile/ProfileActivityFeed'

interface UserProfileProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: UserProfileProps): Promise<Metadata> {
  const { username } = await params
  const cleanUsername = decodeURIComponent(username).replace(/^@/, '')
  return {
    title: `Perfil de @${cleanUsername} | sleepyred999`,
    description: `Perfil público, canción favorita y feed de actividad de @${cleanUsername} en sleepyred999`,
  }
}

export default async function PublicUserProfilePage({ params }: UserProfileProps) {
  const { username } = await params
  const normalizedUsername = decodeURIComponent(username).trim()
  const cleanUsername = normalizedUsername.startsWith('@')
    ? normalizedUsername.slice(1)
    : normalizedUsername

  const supabase = await createClient()
  const currentUser = await getCurrentUser()

  // Buscar perfil en Supabase por username (case-insensitive) o id
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', cleanUsername)
    .maybeSingle()

  if (!profile) {
    const { data: byDisplay } = await supabase
      .from('profiles')
      .select('*')
      .ilike('display_name', cleanUsername)
      .maybeSingle()
    if (byDisplay) profile = byDisplay
  }

  // Fallback diferenciado y coherente para cada perfil si la BD local aún no tiene la fila
  const isSleepyAdmin = cleanUsername.toLowerCase() === 'sleepyred999'
  const isRedRecordings = cleanUsername.toLowerCase() === 'redrecordings'

  const defaultProfile: Profile = {
    id: cleanUsername,
    email: `${cleanUsername.toLowerCase()}@sleepyred999.com`,
    display_name: isSleepyAdmin
      ? 'sleepyred999'
      : isRedRecordings
      ? 'redrecordings'
      : cleanUsername,
    username: cleanUsername,
    bio: isSleepyAdmin
      ? 'Artista, productor audiovisual y creador de este espacio. Bienvenido a mi bitácora y tienda oficial.'
      : isRedRecordings
      ? 'Tester oficial de funcionalidades regulares y coleccionista de audio en sleepyred999.'
      : 'Miembro de la comunidad oficial de sleepyred999.',
    avatar_url: isSleepyAdmin
      ? '/images/logos/PNG-04.png'
      : isRedRecordings
      ? '/images/avatars/avatar_cyber_red.jpg'
      : null,
    banner_url: isSleepyAdmin
      ? '/images/releases/criss-angel.jpg'
      : '/images/banners/banner_cyber_neon.jpg',
    favorite_product_id: isRedRecordings ? 'red-recordings' : 'criss-angel',
    is_public: true,
    role: isSleepyAdmin ? 'admin' : 'user',
    created_at: new Date('2026-01-01').toISOString(),
    updated_at: new Date().toISOString(),
  }

  const userProfile: Profile = (profile as Profile) || defaultProfile

  if (!userProfile) {
    notFound()
  }

  const isOwner =
    currentUser?.id === userProfile.id ||
    (currentUser?.profile?.username &&
      currentUser.profile.username.toLowerCase() === userProfile.username?.toLowerCase())

  // Canción favorita con preview de 30 segundos
  const favoriteSong = getSongById(userProfile.favorite_product_id)

  // Obtener actividades del usuario desde Supabase
  const activities: ActivityItem[] = []

  // 1. Notas personales y eventos especiales en profile_updates
  const { data: updates } = await supabase
    .from('profile_updates')
    .select('*')
    .eq('user_id', userProfile.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (updates && updates.length > 0) {
    for (const u of updates) {
      if (u.body.startsWith('[FAVORITE_SONG_CHANGED]:')) {
        const songId = u.body.replace('[FAVORITE_SONG_CHANGED]:', '').trim()
        const song = getSongById(songId)
        activities.push({
          id: u.id,
          type: 'favorite_song_changed',
          targetTitle: song.title,
          audioPreviewUrl: song.audioPreviewUrl,
          createdAt: u.created_at,
        })
      } else {
        activities.push({
          id: u.id,
          type: 'note',
          body: u.body,
          createdAt: u.created_at,
        })
      }
    }
  }

  // 2. Comentarios del usuario
  const { data: comments } = await supabase
    .from('comments')
    .select('id, body, created_at, post_id, posts (title)')
    .eq('user_id', userProfile.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (comments && comments.length > 0) {
    for (const c of comments) {
      const postTitle = (c.posts as { title?: string } | null)?.title || 'Publicación'
      activities.push({
        id: c.id,
        type: 'comment',
        targetTitle: postTitle,
        targetHref: c.post_id ? `/posts/${c.post_id}` : undefined,
        body: c.body,
        createdAt: c.created_at,
      })
    }
  }

  // 3. Compras registradas en library_items (Gold Hue)
  const { data: libraryItems } = await supabase
    .from('library_items')
    .select('id, created_at, products (id, name)')
    .eq('user_id', userProfile.id)
    .limit(10)

  if (libraryItems && libraryItems.length > 0) {
    for (const lib of libraryItems) {
      const prodName = (lib.products as { name?: string } | null)?.name || 'Lanzamiento digital'
      activities.push({
        id: lib.id,
        type: 'purchase',
        targetTitle: prodName,
        createdAt: lib.created_at,
      })
    }
  }

  // Si no hay actividades en BD aún, seed demo dopamínico para tester
  if (activities.length === 0) {
    if (isRedRecordings) {
      activities.push(
        {
          id: 'demo-song-1',
          type: 'favorite_song_changed',
          targetTitle: 'Red Recordings (VIP Dub)',
          audioPreviewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          createdAt: '2026-09-23T16:30:00.000Z',
        },
        {
          id: 'demo-purchase-1',
          type: 'purchase',
          targetTitle: 'Criss Angel (Edición Digital Exclusiva)',
          createdAt: '2026-09-23T15:00:00.000Z',
        },
        {
          id: 'demo-note-1',
          type: 'note',
          body: 'Probando la calidad de audio sin pérdida en la biblioteca. El sonido en estéreo está impecable.',
          createdAt: '2026-09-23T11:00:00.000Z',
        }
      )
    } else if (isSleepyAdmin) {
      activities.push(
        {
          id: 'demo-song-sleepy',
          type: 'favorite_song_changed',
          targetTitle: 'Criss Angel (Master Edit)',
          audioPreviewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          createdAt: '2026-09-23T16:15:00.000Z',
        },
        {
          id: 'demo-note-sleepy',
          type: 'note',
          body: 'Nuevo drop masterizado en camino para los miembros de la comunidad.',
          createdAt: '2026-09-23T13:00:00.000Z',
        }
      )
    }
  }

  // Ordenar cronológicamente
  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const initial = (userProfile.display_name || userProfile.username || 'U').charAt(0).toUpperCase()

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      {/* Hero Header con Banner Personalizado */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-800/90 bg-neutral-950 shadow-2xl space-y-6">
        {/* Banner Cover Image */}
        <div className="relative w-full h-48 sm:h-64 bg-neutral-900 overflow-hidden">
          {userProfile.banner_url ? (
            <Image
              src={userProfile.banner_url}
              alt="Banner de Perfil"
              fill
              priority
              className="object-cover filter brightness-75"
              sizes="(max-width: 768px) 100vw, 896px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-red-950 via-neutral-900 to-neutral-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
        </div>

        {/* Profile Details Container */}
        <div className="relative px-6 pb-6 pt-0 sm:px-8 space-y-5 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              {/* Avatar con anillo */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-neutral-950 bg-neutral-900 shadow-2xl shrink-0 ring-2 ring-red-600/50">
                {userProfile.avatar_url ? (
                  <Image
                    src={userProfile.avatar_url}
                    alt={userProfile.display_name || 'Avatar'}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-extrabold text-red-400 bg-red-950/80">
                    {initial}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {userProfile.display_name || userProfile.username}
                  </h1>
                  {userProfile.role === 'admin' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800 flex items-center gap-1 shadow-sm">
                      <ShieldCheck className="w-3 h-3 text-red-400" /> Creador / Admin
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-neutral-400">
                  @{userProfile.username || 'usuario'}
                </p>
              </div>
            </div>

            {/* Acciones de Propietario */}
            {isOwner && (
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-neutral-200 bg-neutral-900/90 border border-neutral-800 hover:border-red-600 hover:text-white transition-all shadow-md active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5 text-red-400" />
                <span>Personalizar Mi Perfil</span>
              </Link>
            )}
          </div>

          {/* Canción Favorita con Reproductor Interactivo de Snippet de 30s */}
          <div className="pt-2">
            <FavoriteSongSnippetPlayer song={favoriteSong} />
          </div>

          {/* Biografía */}
          <div className="pt-3 border-t border-neutral-800/80 space-y-2">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">
              Biografía
            </h2>
            <p className="text-sm text-neutral-200 leading-relaxed font-sans max-w-2xl">
              {userProfile.bio || 'Este usuario aún no ha agregado una biografía.'}
            </p>
          </div>

          <div className="pt-1 flex items-center gap-4 text-xs font-mono text-neutral-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" /> Miembro desde{' '}
              {new Date(userProfile.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Feed de Actividad Dopamínico */}
      <ProfileActivityFeed
        userId={userProfile.id}
        username={userProfile.username || cleanUsername}
        displayName={userProfile.display_name || userProfile.username || 'Usuario'}
        avatarUrl={userProfile.avatar_url}
        isOwner={Boolean(isOwner)}
        activities={activities}
      />
    </main>
  )
}
