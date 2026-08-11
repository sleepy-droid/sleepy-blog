import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { Award, Music, Sparkles, MessageSquare, ShieldCheck, Camera, Edit3, Cake, UserCheck, Calendar } from 'lucide-react'
import { ProfileEditForm } from './ProfileEditForm'

export default async function ProfilePage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect('/auth/login?next=/profile')
  }

  const supabase = await createClient()

  // Fetch user profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single()

  // Fetch user library items to check owned songs / badges
  const { data: libraryItems } = await supabase
    .from('library_items')
    .select('*, products (*)')
    .eq('user_id', currentUser.id)

  const ownedProducts = libraryItems?.map((item) => item.products) || []
  const hasPurchasedFav = ownedProducts.length > 0

  // Favorite product details
  const favoriteProduct = ownedProducts[0] || {
    id: 'criss-angel',
    name: 'Criss Angel (Edición Digital Exclusiva)',
    category: 'music',
    thumbnail_url: '/images/releases/criss-angel.jpg'
  }

  const name = profile?.display_name || currentUser.email?.split('@')[0] || 'Miembro'
  const username = profile?.username || currentUser.email?.split('@')[0] || 'user'
  const bannerUrl = profile?.banner_url || '/images/releases/criss-angel.jpg'
  const avatarUrl = profile?.avatar_url
  const statusUpdate = profile?.status_update || 'Disfrutando los lanzamientos oficiales en máster sin compresión.'
  const birthday = profile?.birthday
  const gender = profile?.gender

  const getGenderLabel = (g?: string | null) => {
    switch (g) {
      case 'male': return 'Hombre ♂'
      case 'female': return 'Mujer ♀'
      case 'gender_neutral': return 'Género Neutro ⚥'
      default: return 'No especificado'
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      {/* MySpace Aesthetic Banner Header */}
      <section className="relative w-full rounded-3xl overflow-hidden border border-neutral-800/90 bg-neutral-950 shadow-2xl">
        <div className="relative w-full h-44 sm:h-56 bg-neutral-900">
          <Image
            src={bannerUrl}
            alt="Profile Banner"
            fill
            priority
            className="object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
        </div>

        {/* Profile Avatar & Info Bar Overlay */}
        <div className="relative px-6 pb-6 pt-0 -mt-16 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-neutral-950 bg-neutral-900 shadow-2xl shrink-0 ring-2 ring-red-600/50">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={name} fill className="object-cover" />
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-300 bg-red-950 border border-red-900 px-2 py-0.5 rounded-full">
                    Creador / Admin
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-neutral-400">@{username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
          <span className="text-[10px] font-mono uppercase text-red-400 font-bold block">Status Update Actual</span>
          <p className="text-xs font-medium text-neutral-200 italic truncate">"{statusUpdate}"</p>
        </div>
      </section>

      {/* Personal Info & Favorite Song Grid */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-6 border border-neutral-800/90 rounded-2xl p-5 bg-neutral-900/40 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-bold text-white">Canción Favorita & Medalla</h2>
            </div>
            {hasPurchasedFav && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/60 px-2.5 py-0.5 rounded-full">
                <Award className="w-3 h-3 text-amber-400" /> Medalla de Creador
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 bg-neutral-950/80 p-3.5 rounded-xl border border-neutral-800">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-neutral-800 shrink-0">
              <Image
                src={favoriteProduct.thumbnail_url || '/images/releases/criss-angel.jpg'}
                alt={favoriteProduct.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white truncate">{favoriteProduct.name}</h3>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">sleepyred999</p>
            </div>
          </div>

          {/* Birthday & Gender Info Badges */}
          <div className="pt-2 border-t border-neutral-800/60 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/80 space-y-0.5">
              <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                <Cake className="w-3 h-3 text-pink-400" /> Cumpleaños
              </span>
              <span className="text-neutral-200 font-semibold block">{birthday || 'No especificado'}</span>
            </div>
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/80 space-y-0.5">
              <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-sky-400" /> Género
              </span>
              <span className="text-neutral-200 font-semibold block">{getGenderLabel(gender)}</span>
            </div>
          </div>
        </div>

        {/* User Bio & Edit Profile Form */}
        <div className="md:col-span-6 border border-neutral-800/90 rounded-2xl p-5 bg-neutral-900/40 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-bold text-white">Biografía & Configuración</h2>
            </div>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
            {profile?.bio || 'Miembro oficial de la comunidad sleepyred999. Apoyando producciones musicales y drops exclusivos.'}
          </p>

          <ProfileEditForm profile={profile} />
        </div>
      </section>
    </main>
  )
}
