import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { Headphones, Award, Package, ShoppingBag } from 'lucide-react'
import { WebPlayerClient, type PlayerTrack } from './WebPlayerClient'
import { SONG_PRESETS } from '@/lib/profile-presets'
import type { Product } from '@/lib/types'

type PlayerPageProps = {
  searchParams: Promise<{ track?: string }>
}

export default async function WebPlayerPage({ searchParams }: PlayerPageProps) {
  const { track: requestedTrackId } = await searchParams
  const currentUser = await getCurrentUser()
  const supabase = await createClient()

  const unlockedProductIds = new Set<string>()
  const tracksMap = new Map<string, PlayerTrack>()

  // 1. Cargar los ítems desbloqueados en la biblioteca del usuario autenticado
  if (currentUser) {
    const { data: libData } = await supabase
      .from('library_items')
      .select('id, product_id, source, created_at, products (*)')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    for (const item of libData || []) {
      const prod = (Array.isArray(item.products) ? item.products[0] : item.products) as Product | null
      if (!prod) continue
      const hasAudio = Boolean(
        prod.wav_url ||
          prod.mp3_url ||
          prod.audio_preview_url ||
          prod.acapella_url ||
          prod.instrumental_url ||
          prod.category === 'music' ||
          prod.fulfillment === 'digital'
      )
      if (!hasAudio) continue

      unlockedProductIds.add(prod.id)
      if (prod.slug) unlockedProductIds.add(prod.slug)

      tracksMap.set(prod.id, {
        id: prod.id,
        slug: prod.slug || prod.id,
        title: prod.name,
        artist: 'sleepyred999',
        description: prod.description || 'Máster Digital Oficial',
        thumbnailUrl: prod.thumbnail_url || '/images/logos/PNG-04.png',
        wavUrl: prod.wav_url || null,
        mp3Url: prod.mp3_url || prod.audio_preview_url || null,
        previewUrl: prod.audio_preview_url || prod.mp3_url || prod.wav_url || null,
        acapellaUrl: prod.acapella_url || null,
        instrumentalUrl: prod.instrumental_url || null,
        videoUrl: prod.video_url || null,
        isUnlocked: true,
        priceCents: prod.price_cents || 0,
      })
    }
  }

  // 2. Cargar el catálogo digital publicado de la tienda
  const { data: catalogProducts } = await supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .or('category.eq.music,fulfillment.eq.digital')
    .order('created_at', { ascending: false })

  for (const p of (catalogProducts || []) as Product[]) {
    if (tracksMap.has(p.id)) continue
    const anyAudio =
      p.wav_url || p.mp3_url || p.audio_preview_url || p.acapella_url || p.instrumental_url
    if (!anyAudio) continue

    const isUnlocked = Boolean(
      currentUser?.isAdmin ||
        unlockedProductIds.has(p.id) ||
        (p.slug && unlockedProductIds.has(p.slug))
    )

    tracksMap.set(p.id, {
      id: p.id,
      slug: p.slug || p.id,
      title: p.name,
      artist: 'sleepyred999',
      description: p.description || 'Lanzamiento Oficial sleepyred999',
      thumbnailUrl: p.thumbnail_url || '/images/logos/PNG-04.png',
      wavUrl: isUnlocked ? p.wav_url || null : null,
      mp3Url: isUnlocked ? p.mp3_url || p.audio_preview_url || null : null,
      previewUrl: p.audio_preview_url || p.mp3_url || p.wav_url || null,
      acapellaUrl: isUnlocked ? p.acapella_url || null : null,
      instrumentalUrl: isUnlocked ? p.instrumental_url || null : null,
      videoUrl: p.video_url || null,
      isUnlocked,
      priceCents: p.price_cents || 0,
    })
  }

  // 3. Si la base de datos aún no tiene canciones cargadas, incluir los presets oficiales de estudio
  if (tracksMap.size === 0) {
    for (const preset of SONG_PRESETS) {
      tracksMap.set(preset.id, {
        id: preset.id,
        slug: preset.id,
        title: preset.title,
        artist: preset.artist,
        description: preset.subtitle,
        thumbnailUrl: preset.thumbnailUrl,
        wavUrl: currentUser?.isAdmin ? preset.audioPreviewUrl : null,
        mp3Url: preset.audioPreviewUrl,
        previewUrl: preset.audioPreviewUrl,
        acapellaUrl: null,
        instrumentalUrl: null,
        videoUrl: null,
        isUnlocked: Boolean(currentUser?.isAdmin),
        priceCents: 1500,
      })
    }
  }

  const tracks = Array.from(tracksMap.values())

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-800/80 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/60 border border-red-900/40 text-red-400">
            <Headphones className="w-3.5 h-3.5" />
            <span>Consola & Reproductor Web Dedicado</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Reproductor Web Digital
          </h1>
          <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
            Reproduce tus másters WAV sin compresión, alterna entre pistas Vocales Acapella e Instrumentales y descarga tus activos verificados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/library"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/50 border border-amber-700/50 hover:bg-amber-900/50 transition-colors"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Vitrina de Trofeos</span>
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-200 bg-neutral-900 border border-neutral-800 hover:text-white hover:border-red-900/50 transition-colors"
          >
            <Package className="w-3.5 h-3.5 text-red-400" />
            <span>Mis Pedidos & Recibos</span>
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-colors shadow-md"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Tienda</span>
          </Link>
        </div>
      </header>

      <WebPlayerClient
        tracks={tracks}
        initialTrackId={requestedTrackId || null}
        isLoggedIn={Boolean(currentUser)}
      />
    </main>
  )
}
