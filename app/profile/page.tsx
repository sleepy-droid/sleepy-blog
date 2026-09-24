import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import {
  Sparkles,
  Edit3,
  Cake,
  UserCheck,
  ExternalLink,
} from 'lucide-react'
import { ProfileEditForm } from './ProfileEditForm'
import { getSongById } from '@/lib/profile-presets'
import { FavoriteSongSnippetPlayer } from '@/components/profile/FavoriteSongSnippetPlayer'
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

  const name = profile?.display_name || currentUser.email?.split('@')[0] || 'Miembro'
  const username = profile?.username || currentUser.email?.split('@')[0] || 'user'
  const bannerUrl = profile?.banner_url || '/images/releases/criss-angel.jpg'
  const avatarUrl = profile?.avatar_url
  const statusUpdate =
    profile?.status_update ||
    'Disfrutando los lanzamientos oficiales en máster sin compresión.'
  const birthday = profile?.birthday
  const gender = profile?.gender

  const favoriteSong = getSongById(profile?.favorite_product_id)

  const getGenderLabel = (g?: string | null) => {
    switch (g) {
      case 'male':
        return 'Hombre ♂'
      case 'female':
        return 'Mujer ♀'
      case 'gender_neutral':
        return 'Género Neutro ⚥'
      default:
        return 'No especificado'
    }
  }

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

  const { data: comments } = await supabase
    .from('comments')
    .select('id, body, created_at, post_id, posts (title)')
    .eq('user_id', currentUser.id)
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

  const { data: libraryItems } = await supabase
    .from('library_items')
    .select('id, created_at, products (id, name)')
    .eq('user_id', currentUser.id)
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

  activities.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      {/* Banner Header */}
      <section className="relative w-full rounded-3xl overflow-hidden border border-neutral-800/90 bg-neutral-950 shadow-2xl">
        <div className="relative w-full h-44 sm:h-56 bg-neutral-900">
          <Image
            src={bannerUrl}
            alt="Profile Banner"
            fill
            priority
            className="object-cover opacity-60"
            sizes="(max-width: 768px) 100vw, 896px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
        </div>

        {/* Profile Avatar & Info Bar */}
        <div className="relative px-6 pb-6 pt-0 -mt-16 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-neutral-950 bg-neutral-900 shadow-2xl shrink-0 ring-2 ring-red-600/50">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={name} fill className="object-cover" sizes="112px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-extrabold text-red-400 bg-red-950/80">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">{name}</h1>
                {currentUser.isAdmin && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-300 bg-red-950 border border-red-900 px-2 py-0.5 rounded-full shadow-sm">
                    Creador / Admin
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-neutral-400">@{username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/u/${username}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors shadow-sm"
            >
              <span>Ver Perfil Público</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/library"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-800 hover:bg-red-700 transition-colors shadow-md"
            >
              <span>Mi Biblioteca</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Status Update Feed Banner */}
      <section className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-md">
        <Sparkles className="w-5 h-5 text-red-400 shrink-0" />
        <div className="min-w-0 flex-1 space-y-0.5">
          <span className="text-[10px] font-mono uppercase text-red-400 font-bold block">
            Status Update Actual
          </span>
          <p className="text-xs font-medium text-neutral-200 italic truncate">
            &ldquo;{statusUpdate}&rdquo;
          </p>
        </div>
      </section>

      {/* Grid: Canción Favorita & Personalización */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-6 space-y-4">
          <FavoriteSongSnippetPlayer song={favoriteSong} />

          {/* Cumpleaños y Género */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-neutral-900/50 p-3 rounded-2xl border border-neutral-800/80 space-y-1">
              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                <Cake className="w-3.5 h-3.5 text-pink-400" /> Cumpleaños
              </span>
              <span className="text-neutral-200 font-semibold block">
                {birthday || 'No especificado'}
              </span>
            </div>

            <div className="bg-neutral-900/50 p-3 rounded-2xl border border-neutral-800/80 space-y-1">
              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-sky-400" /> Género
              </span>
              <span className="text-neutral-200 font-semibold block">
                {getGenderLabel(gender)}
              </span>
            </div>
          </div>
        </div>

        {/* Biografía y Formulario de Personalización */}
        <div className="md:col-span-6 border border-neutral-800/90 rounded-2xl p-5 bg-neutral-900/40 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-bold text-white">Biografía & Personalización</h2>
            </div>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
            {profile?.bio ||
              'Miembro oficial de la comunidad sleepyred999. Apoyando producciones musicales y drops exclusivos.'}
          </p>

          <ProfileEditForm profile={profile} />
        </div>
      </section>

      {/* Feed de Actividad del Usuario */}
      <ProfileActivityFeed
        userId={currentUser.id}
        username={username}
        displayName={name}
        avatarUrl={avatarUrl}
        isOwner={true}
        activities={activities}
      />
    </main>
  )
}
