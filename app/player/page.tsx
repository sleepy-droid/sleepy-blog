import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { hydrateProductWithFolderAssets } from '@/lib/product-files'
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
  const addedProductIds = new Set<string>()
  const tracksMap = new Map<string, PlayerTrack>()

  const addProductTracks = (rawProd: Product, isUnlocked: boolean) => {
    const prod = hydrateProductWithFolderAssets(rawProd)
    if (addedProductIds.has(prod.id)) return
    const folderStats = prod.folder_stats
    const wavFiles = (folderStats?.files || []).filter(
      (f) =>
        f.extension === '.wav' &&
        !f.name.toLowerCase().includes('acapella') &&
        !f.name.toLowerCase().includes('instrumental')
    )
    const mp3Files = (folderStats?.files || []).filter((f) => f.extension === '.mp3')

    // Si el producto es un álbum con múltiples pistas WAV o MP3 en su directorio
    if (wavFiles.length > 1 || mp3Files.length > 1) {
      addedProductIds.add(prod.id)
      const primaryList = wavFiles.length > 1 ? wavFiles : mp3Files
      primaryList.forEach((file, idx) => {
        const trackKey = `${prod.id}::${file.name}`
        const matchingMp3 = mp3Files[idx]?.publicUrl || prod.mp3_url || prod.audio_preview_url || null
        const fileUrl = file.publicUrl || prod.wav_url || prod.mp3_url || null
        tracksMap.set(trackKey, {
          id: trackKey,
          productId: prod.id,
          fileName: file.name,
          slug: prod.slug || prod.id,
          title: `${prod.name} — ${idx + 1}. ${file.title || file.name}`,
          artist: 'sleepyred999',
          description: prod.description || `Pista #${idx + 1} del álbum ${prod.name}`,
          thumbnailUrl: prod.thumbnail_url || '/images/logos/PNG-04.png',
          wavUrl: isUnlocked ? (file.extension === '.wav' ? fileUrl : prod.wav_url || null) : null,
          mp3Url: isUnlocked ? matchingMp3 || fileUrl : null,
          previewUrl: matchingMp3 || fileUrl,
          acapellaUrl: isUnlocked ? prod.acapella_url || null : null,
          instrumentalUrl: isUnlocked ? prod.instrumental_url || null : null,
          videoUrl: prod.video_url || null,
          isUnlocked,
          priceCents: prod.price_cents || 0,
        })
      })
      return
    }

    addedProductIds.add(prod.id)
    tracksMap.set(prod.id, {
      id: prod.id,
      productId: prod.id,
      slug: prod.slug || prod.id,
      title: prod.name,
      artist: 'sleepyred999',
      description: prod.description || 'Máster Digital Oficial',
      thumbnailUrl: prod.thumbnail_url || '/images/logos/PNG-04.png',
      wavUrl: isUnlocked ? prod.wav_url || null : null,
      mp3Url: isUnlocked ? prod.mp3_url || prod.audio_preview_url || null : null,
      previewUrl: prod.audio_preview_url || prod.mp3_url || prod.wav_url || null,
      acapellaUrl: isUnlocked ? prod.acapella_url || null : null,
      instrumentalUrl: isUnlocked ? prod.instrumental_url || null : null,
      videoUrl: prod.video_url || null,
      isUnlocked,
      priceCents: prod.price_cents || 0,
    })
  }

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

      addProductTracks(prod, true)
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
    if (addedProductIds.has(p.id)) continue
    const anyAudio =
      p.wav_url || p.mp3_url || p.audio_preview_url || p.acapella_url || p.instrumental_url
    if (!anyAudio) continue

    const isUnlocked = Boolean(
      currentUser?.isAdmin ||
        unlockedProductIds.has(p.id) ||
        (p.slug && unlockedProductIds.has(p.slug))
    )

    addProductTracks(p, isUnlocked)
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
        priceCents: preset.priceCents ?? 99,
      })
    }
  }

  const tracks = Array.from(tracksMap.values())

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-2 pb-8 font-sans">
      <WebPlayerClient
        tracks={tracks}
        initialTrackId={requestedTrackId || null}
        isLoggedIn={Boolean(currentUser)}
      />
    </main>
  )
}
