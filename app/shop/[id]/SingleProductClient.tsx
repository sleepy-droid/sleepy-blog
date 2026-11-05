'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Play, Pause, ShoppingBag, ShieldCheck, Sparkles, Music, Package, Maximize2, X, Volume2, VolumeX, Tag, Zap, PictureInPicture2, Minimize2 } from 'lucide-react'
import { formatPrice, type Product } from '@/lib/types'
import { normalizeMediaUrl } from '@/lib/utils'
import { useCart } from '@/lib/cart'
import { useLanguage } from '@/lib/i18n'
import { toggleVote, getMyVoteState } from '@/app/votes/actions'
import { GuestLoginModal } from '@/components/auth/GuestLoginModal'
import { useGlobalPlayer, productToPlayerTracks } from '@/lib/player-context'

type SingleProductClientProps = {
  product: Product
  initialUserVote?: 1 | -1 | 0
}

export function SingleProductClient({ product, initialUserVote = 0 }: SingleProductClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { addToCart } = useCart()
  const { t } = useLanguage()

  // Size selection for physical merch (S, M, L, XL)
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL'>('L')
  
  // Real persistent Upvote / Downvote rating state
  const [upvotes, setUpvotes] = useState(product.upvotes ?? 0)
  const [downvotes, setDownvotes] = useState(product.downvotes ?? 0)
  const [userVote, setUserVote] = useState<1 | -1 | 0>(initialUserVote)
  const [isVoting, setIsVoting] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)

  useEffect(() => {
    setUpvotes(product.upvotes ?? 0)
    setDownvotes(product.downvotes ?? 0)
    setUserVote(initialUserVote)
  }, [product.upvotes, product.downvotes, initialUserVote])

  useEffect(() => {
    let active = true
    getMyVoteState('product', product.id)
      .then((res) => {
        if (!active) return
        setUserVote(res.userVote)
        if (typeof res.upvotes === 'number') setUpvotes(res.upvotes)
        if (typeof res.downvotes === 'number') setDownvotes(res.downvotes)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [product.id])

  // Global Audio Player & Picture-in-Picture integration
  const {
    activeTrack,
    isPlaying: globalIsPlaying,
    currentTime: globalCurrentTime,
    duration: globalDuration,
    isMuted,
    isMinimized,
    isPiPActive,
    selectAndPlayTrack,
    seek,
    toggleMute,
    setIsMinimized,
    togglePiP,
  } = useGlobalPlayer()

  // Lightbox modal state for Amazon-style image viewing
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const productTracks = useMemo(() => productToPlayerTracks(product, false), [product])
  const [selectedTrackIdx, setSelectedTrackIdx] = useState<number>(0)

  const wavAlbumTracks = (product.folder_stats?.files || []).filter(
    (f) =>
      f.extension === '.wav' &&
      !f.name.toLowerCase().includes('acapella') &&
      !f.name.toLowerCase().includes('instrumental')
  )
  const mp3AlbumTracks = (product.folder_stats?.files || []).filter((f) => f.extension === '.mp3')
  const coverFiles = (product.folder_stats?.files || []).filter((f) =>
    ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(f.extension)
  )
  const albumTracks = wavAlbumTracks.length > 1 ? wavAlbumTracks : mp3AlbumTracks.length > 1 ? mp3AlbumTracks : []

  const resolvedThumbnailUrl =
    normalizeMediaUrl(product.thumbnail_url) || coverFiles[0]?.publicUrl || ''

  const defaultPreviewUrl =
    normalizeMediaUrl(
      product.audio_preview_url ||
        product.wav_url ||
        product.mp3_url ||
        wavAlbumTracks[0]?.publicUrl ||
        mp3AlbumTracks[0]?.publicUrl ||
        ''
    )

  const currentProductTrack = productTracks[selectedTrackIdx] || productTracks[0] || null
  const isThisProductActive = productTracks.some((t) => t.id === activeTrack?.id)
  const isPlaying = isThisProductActive && globalIsPlaying
  const currentTime = isThisProductActive ? globalCurrentTime : 0
  const duration = isThisProductActive
    ? globalDuration || 30
    : product.duration_seconds || 30

  const selectedTrackTitle =
    isThisProductActive && activeTrack
      ? activeTrack.title
      : albumTracks.length > 0
      ? albumTracks[selectedTrackIdx]?.title || albumTracks[selectedTrackIdx]?.name || product.name
      : product.name

  const isMusic =
    product.category === 'music' ||
    product.fulfillment === 'digital' ||
    !!defaultPreviewUrl ||
    albumTracks.length > 0
  const previewUrl = normalizeMediaUrl(defaultPreviewUrl)

  const handleVote = async (val: 1 | -1) => {
    if (isVoting) return
    setIsVoting(true)
    try {
      const res = await toggleVote('product', product.id, val)
      if (res.requireAuth) {
        setShowGuestModal(true)
      } else if (res.success) {
        if (typeof res.newLikeCount === 'number') setUpvotes(res.newLikeCount)
        if (typeof res.newDownvoteCount === 'number') setDownvotes(res.newDownvoteCount)
        setUserVote(res.userVote ?? 0)
      }
    } finally {
      setIsVoting(false)
    }
  }

  const handleAddToCart = () => {
    const variant = product.fulfillment === 'physical' ? selectedSize : 'Digital Master'
    addToCart(product, variant, 1)
  }

  const handleBuyNow = () => {
    const variant = product.fulfillment === 'physical' ? selectedSize : 'Digital Master'
    addToCart(product, variant, 1)
    router.push('/checkout')
  }

  const togglePlay = () => {
    const targetTrack =
      isThisProductActive && activeTrack
        ? activeTrack
        : currentProductTrack
    if (!targetTrack) return
    selectAndPlayTrack(targetTrack, 'master', productTracks)
  }

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    if (isThisProductActive) {
      seek(time)
    }
  }

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      {/* LEFT COLUMN: Amazon-style Thumbnail Viewer with Smooth Zoom */}
      <div className="lg:col-span-6 space-y-4">
        <div 
          onClick={() => setIsLightboxOpen(true)}
          className="group relative w-full aspect-square rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black cursor-zoom-in transition-all duration-300"
        >
          {resolvedThumbnailUrl ? (
            <Image
              src={resolvedThumbnailUrl}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 600px"
              className="object-cover group-hover:scale-110 transition-transform duration-500 transform-gpu"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 space-y-2">
              <Package className="w-12 h-12 stroke-1" />
              <span className="text-xs">Sin portada disponible</span>
            </div>
          )}

          {/* Hover Zoom Overlay Badge */}
          <div className="absolute top-4 right-4 bg-neutral-950/80 backdrop-blur-md border border-neutral-800 p-2 rounded-xl text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
            <Maximize2 className="w-4 h-4" />
          </div>

          {/* Fulfillment & Category Badge */}
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className="text-xs uppercase font-bold text-red-300 bg-red-950/90 border border-red-800/60 px-3 py-1 rounded-lg backdrop-blur-md shadow-md">
              {product.fulfillment === 'digital' ? t('product_digital_release') : t('product_physical_edition')}
            </span>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-500">
          Haz clic sobre la imagen para ampliar en alta resolución
        </p>
      </div>

      {/* RIGHT COLUMN: Title, Pricing, SoundCloud Audio Player, Specs, Purchase */}
      <div className="lg:col-span-6 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-mono font-semibold text-red-500 bg-red-950/50 px-2.5 py-0.5 rounded border border-red-900/30">
              {product.category}
            </span>
            {product.is_featured && (
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-400 bg-amber-950/50 px-2.5 py-0.5 rounded border border-amber-900/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Destacado
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mt-2 leading-tight">
            {product.name}
          </h1>

          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-red-400">
              {formatPrice(product.price_cents, product.currency)}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              {product.fulfillment === 'digital' ? t('product_instant_delivery') : t('product_fast_shipping')}
            </span>
          </div>
        </div>

        <p className="text-neutral-300 text-sm leading-relaxed border-l-2 border-red-900/60 pl-3">
          {product.description}
        </p>

        {/* SoundCloud Style Audio Preview Player with Picture-in-Picture & Persistent Mini-Tab */}
        {isMusic && previewUrl && (
          <div className="bg-gradient-to-r from-red-950/60 via-neutral-950 to-neutral-900 border border-red-900/50 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            {/* ROW 1 (TOP): Cover Art & Song Name */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-red-900/60 bg-neutral-950 shrink-0 shadow-md">
                {resolvedThumbnailUrl ? (
                  <Image
                    src={resolvedThumbnailUrl}
                    alt={product.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-red-400">
                    <Music className="w-5 h-5" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold uppercase tracking-wider">
                  <Music className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {albumTracks.length > 1
                      ? `Reproductor Álbum (${albumTracks.length} pistas)`
                      : 'Reproductor Web & PiP'}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-extrabold text-white truncate">
                  {selectedTrackTitle || product.name}
                </p>
              </div>
            </div>

            {/* ROW 2 (MIDDLE): Audio Timeline Scrubber & Equalizer Bars */}
            <div className="space-y-1.5">
              <div className="relative flex items-center">
                <input
                  type="range"
                  min={0}
                  max={duration || 30}
                  step={0.1}
                  value={currentTime}
                  onChange={handleScrub}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>{formatTime(currentTime)}</span>
                <div className="flex items-center gap-0.5 h-3">
                  {[40, 80, 60, 100, 30, 90, 50, 70, 95, 45].map((h, i) => (
                    <span
                      key={i}
                      className={`w-0.5 bg-red-500 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : 'opacity-40'}`}
                      style={{ height: isPlaying ? `${(h * (i % 2 === 0 ? 1 : 0.7))}%` : '20%' }}
                    />
                  ))}
                </div>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* ROW 3 (BOTTOM): Controls (Play/Pause, Mute, Modo PiP, Minimizar) */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-red-950/60">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pausar previsualización' : 'Reproducir previsualización'}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-red-900/50 transition-all cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Reproducir</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-2.5 text-neutral-300 hover:text-white rounded-xl bg-neutral-900/90 border border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer"
                  title={isMuted ? 'Desactivar silencio' : 'Silenciar'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (!isThisProductActive && currentProductTrack) {
                      selectAndPlayTrack(currentProductTrack, 'master', productTracks)
                    }
                    togglePiP()
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    isPiPActive
                      ? 'bg-red-700 text-white border-red-400 shadow-md'
                      : 'bg-red-950/70 text-red-300 border-red-800/70 hover:bg-red-900/60 hover:text-white'
                  }`}
                  title="Modo Picture-in-Picture (sigue reproduciendo en ventana flotante aunque cambies de ventana o pestaña)"
                >
                  <PictureInPicture2 className="w-3.5 h-3.5" />
                  <span>{isPiPActive ? 'PiP Activo' : 'Modo PiP'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!isThisProductActive && currentProductTrack) {
                      selectAndPlayTrack(currentProductTrack, 'master', productTracks)
                    }
                    setIsMinimized(!isMinimized)
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-mono text-neutral-300 hover:text-white rounded-xl bg-neutral-900/90 border border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Minimizar reproductor en pestaña flotante"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden sm:inline">Minimizar</span>
                </button>
              </div>
            </div>

            {/* Interactive Album Tracklist (when product contains multiple .wav / .mp3 tracks) */}
            {albumTracks.length > 1 && (
              <div className="pt-3 border-t border-red-900/40 space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-red-300 font-bold block">
                  Tracklist del Álbum ({albumTracks.length} pistas incluidas):
                </span>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {albumTracks.map((track, idx) => {
                    const trackObj = productTracks[idx] || productTracks[0]
                    const isTrackActive = activeTrack?.id === trackObj?.id
                    return (
                      <button
                        key={track.name}
                        type="button"
                        onClick={() => {
                          setSelectedTrackIdx(idx)
                          if (trackObj) {
                            selectAndPlayTrack(trackObj, 'master', productTracks)
                          }
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                          isTrackActive
                            ? 'bg-red-700/80 text-white font-bold border border-red-500/60'
                            : 'bg-neutral-900/80 text-neutral-300 hover:text-white border border-neutral-800/80'
                        }`}
                      >
                        <span className="truncate">
                          {idx + 1}. {track.title || track.name}
                        </span>
                        <span className="text-[10px] opacity-80 shrink-0">
                          {track.sizeFormatted}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Variant Selector for Physical Products (Hoodies, Merch) */}
        {product.fulfillment === 'physical' && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              {t('product_select_size')}
            </label>
            <div className="flex gap-2">
              {(['S', 'M', 'L', 'XL'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-10 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                    selectedSize === size
                      ? 'bg-red-950 text-white border-2 border-red-600 shadow-[0_0_12px_rgba(220,38,38,0.4)]'
                      : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700 hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Technical Specifications Table */}
        <div className="border border-neutral-800 rounded-2xl p-4 bg-neutral-950/60 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-red-400" />
              {t('product_specs_title')}
            </h3>
            {product.folder_stats && (
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-red-950/80 border border-red-900/50 text-red-400">
                ● En vivo ({product.folder_stats.totalSizeFormatted})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/80">
              <span className="text-neutral-500 block text-[10px] uppercase">Portada HD</span>
              <span className="text-neutral-200 font-semibold">
                {product.folder_stats?.coverSizeFormatted
                  ? `Incluido (${product.folder_stats.coverSizeFormatted})`
                  : product.thumbnail_url
                  ? 'Incluido'
                  : 'No disponible'}
              </span>
            </div>

            <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/80">
              <span className="text-neutral-500 block text-[10px] uppercase">Audio WAV Máster</span>
              <span className="text-neutral-200 font-semibold">
                {product.folder_stats?.wavSizeFormatted
                  ? `Incluido (${product.folder_stats.wavSizeFormatted}, 24-bit)`
                  : product.wav_url
                  ? 'Incluido (24-bit / 44.1kHz)'
                  : isMusic
                  ? 'Incluido'
                  : 'N/A'}
              </span>
            </div>

            <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/80">
              <span className="text-neutral-500 block text-[10px] uppercase">Audio MP3 / Preview</span>
              <span className="text-neutral-200 font-semibold">
                {product.folder_stats?.mp3SizeFormatted
                  ? `Incluido (${product.folder_stats.mp3SizeFormatted})`
                  : product.mp3_url || product.audio_preview_url
                  ? 'Incluido'
                  : isMusic
                  ? 'Incluido'
                  : 'N/A'}
              </span>
            </div>

            <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/80">
              <span className="text-neutral-500 block text-[10px] uppercase">Licencia de Reproducción</span>
              <span className="text-neutral-200 font-semibold">Uso Personal & Colección</span>
            </div>

            {product.video_url && (
              <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/80">
                <span className="text-neutral-500 block text-[10px] uppercase">Vídeo Oficial</span>
                <span className="text-neutral-200 font-semibold">Disponible (HD Video)</span>
              </div>
            )}

            {product.acapella_url && (
              <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/80">
                <span className="text-neutral-500 block text-[10px] uppercase">Vocal Acapella</span>
                <span className="text-neutral-200 font-semibold">Disponible (Stem WAV)</span>
              </div>
            )}

            {product.instrumental_url && (
              <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/80">
                <span className="text-neutral-500 block text-[10px] uppercase">Pista Instrumental</span>
                <span className="text-neutral-200 font-semibold">Disponible (Beat WAV)</span>
              </div>
            )}

            <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/80 sm:col-span-2">
              <span className="text-neutral-500 block text-[10px] uppercase">Tamaño del Paquete Digital</span>
              <span className="text-red-400 font-bold font-mono">
                {product.folder_stats
                  ? `${product.folder_stats.totalSizeFormatted} (${product.folder_stats.filesCount} archivos en ${product.folder_stats.folderPath})`
                  : product.fulfillment === 'digital'
                  ? 'Paquete Digital'
                  : 'Envío Físico'}
              </span>
            </div>
          </div>

          {/* Living file breakdown list */}
          {product.folder_stats && product.folder_stats.files.length > 0 && (
            <div className="pt-2 border-t border-neutral-800/80 space-y-1.5">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                Archivos detectados en el máster digital:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {product.folder_stats.files.map((file) => (
                  <span
                    key={file.name}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-300"
                  >
                    <span className="text-red-400 font-bold">{file.extension.toUpperCase().slice(1) || 'FILE'}</span>
                    <span className="truncate max-w-[160px] text-neutral-200">{file.name}</span>
                    <span className="text-[10px] text-neutral-500">({file.sizeFormatted})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rating & Heart (❤️) / Broken Heart (💔) Voting Section */}
        <div className="flex items-center justify-between bg-neutral-950/80 border border-neutral-800 p-3.5 rounded-2xl">
          <span className="text-xs font-semibold text-neutral-400">{t('product_vote_label')}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isVoting}
              onClick={() => handleVote(1)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                userVote === 1
                  ? 'bg-red-950 text-red-400 border border-red-700 shadow-[0_0_12px_rgba(220,38,38,0.4)]'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
              title={userVote === 1 ? 'Ya te gusta este producto (clic para quitar)' : 'Me gusta este producto'}
            >
              <span>❤️</span>
              <span>{upvotes}</span>
            </button>

            <button
              type="button"
              disabled={isVoting}
              onClick={() => handleVote(-1)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                userVote === -1
                  ? 'bg-neutral-800 text-neutral-200 border border-neutral-600'
                  : 'bg-neutral-900 text-neutral-500 hover:text-neutral-300 border border-neutral-800'
              }`}
              title="No me convence este producto"
            >
              <span>💔</span>
              {downvotes > 0 && <span>{downvotes}</span>}
            </button>
          </div>
        </div>

        {/* Purchase & Add to Cart Buttons */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full py-3.5 px-5 rounded-xl font-bold text-xs sm:text-sm text-white bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99] border border-neutral-700 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-red-400" />
              <span>{t('add_to_cart')}</span>
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              className="w-full py-3.5 px-5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-600 active:scale-[0.99] border border-red-500/40 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>{t('buy_now')} • {formatPrice(product.price_cents, product.currency)}</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-red-500" />
            <span>Pagos seguros. Acceso inmediato en tu Biblioteca y seguimiento en Mis Pedidos.</span>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for High-Res Image Zoom (Amazon Style) */}
      {isLightboxOpen && (
        <div 
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer z-50"
            aria-label="Cerrar vista ampliada"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative w-full max-w-4xl aspect-square max-h-[85vh] rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl">
            {resolvedThumbnailUrl && (
              <Image
                src={resolvedThumbnailUrl}
                alt={product.name}
                fill
                sizes="1000px"
                className="object-contain"
              />
            )}
          </div>
        </div>
      )}
      <GuestLoginModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        redirectPath={pathname}
        title="¿Quieres calificar este lanzamiento?"
        message="Inicia sesión con tu cuenta de miembro para registrar tu voto real en el catálogo de sleepyred999."
      />
    </div>
  )
}
