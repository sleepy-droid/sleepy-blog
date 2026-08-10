/**
 * Public User Profile Page: /u/[username]
 * File Path: app/u/[username]/page.tsx
 * 
 * Features:
 * 1. MySpace style user profile with custom banner, avatar, bio, and favorite track badge.
 * 2. Lookup by username or profile ID.
 */

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { User, Sparkles, Award, Music, Calendar, ShieldCheck, Heart } from 'lucide-react'
import type { Metadata } from 'next'
import type { Profile } from '@/lib/types'

interface UserProfileProps {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: UserProfileProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `Perfil de @${username} | sleepyred999`,
    description: `Perfil público y colección de @${username} en sleepyred999`,
  }
}

export default async function PublicUserProfilePage({ params }: UserProfileProps) {
  const { username } = await params
  const supabase = await createClient()

  // Find profile by username or id
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.eq.${username},id.eq.${username}`)
    .maybeSingle()

  const demoProfile: Profile = {
    id: 'sleepyred999',
    email: 'creator@sleepyred999.com',
    display_name: 'sleepyred999',
    username: 'sleepyred999',
    bio: 'Artista, productor audiovisual y creador de este espacio. Bienvenido a mi bitácora y tienda oficial.',
    avatar_url: '/images/logos/PNG-04.png',
    banner_url: '/images/releases/criss-angel.jpg',
    favorite_product_id: 'criss-angel',
    is_public: true,
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const userProfile: Profile = (profile as Profile) || (username === 'sleepyred999' ? demoProfile : demoProfile)

  if (!userProfile) {
    notFound()
  }

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      {/* MySpace Style Hero Header Banner */}
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
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-red-950 via-neutral-900 to-neutral-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
        </div>

        {/* Profile Details Container */}
        <div className="relative px-6 pb-6 pt-0 sm:px-8 space-y-4 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-neutral-950 bg-neutral-900 shadow-2xl shrink-0">
                {userProfile.avatar_url ? (
                  <Image src={userProfile.avatar_url} alt={userProfile.display_name || 'Avatar'} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-extrabold text-red-500 bg-neutral-900">
                    {(userProfile.display_name || userProfile.username || 'S').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {userProfile.display_name || userProfile.username}
                  </h1>
                  {userProfile.role === 'admin' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-red-400" /> Creador / Admin
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-neutral-400">@{userProfile.username || 'usuario'}</p>
              </div>
            </div>

            {/* Favorite Track / Badge */}
            <div className="bg-neutral-900/80 border border-neutral-800 p-3 rounded-2xl flex items-center gap-3 backdrop-blur-md">
              <Award className="w-6 h-6 text-amber-400 shrink-0" />
              <div className="text-xs font-mono">
                <span className="text-neutral-500 block text-[10px]">Canción / Producto Favorito</span>
                <span className="text-white font-bold">Criss Angel (Master)</span>
              </div>
            </div>
          </div>

          {/* Biography */}
          <div className="pt-2 border-t border-neutral-900 space-y-2">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Biografía</h2>
            <p className="text-sm text-neutral-200 leading-relaxed font-sans max-w-2xl">
              {userProfile.bio || 'Este usuario aún no ha agregado una biografía.'}
            </p>
          </div>

          <div className="pt-2 flex items-center gap-4 text-xs font-mono text-neutral-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" /> Miembro desde {new Date(userProfile.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
