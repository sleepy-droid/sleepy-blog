'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Play, Pause, ShoppingBag, ShieldCheck, Sparkles, Music, Package, Check, Maximize2, X, Volume2, VolumeX, Tag } from 'lucide-react'
import { formatPrice, type Product } from '@/lib/types'

type SingleProductClientProps = {
  product: Product
}

export function SingleProductClient({ product }: SingleProductClientProps) {
  // Size selection for physical merch (S, M, L, XL)
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL'>('L')
  // Audio Player State (SoundCloud style)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(product.duration_seconds || 0)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Lightbox modal state for Amazon-style image viewing
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  // Added to library status notification
  const [addedStatus, setAddedStatus] = useState<string | null>(null)

  const isMusic = product.category === 'music' || product.fulfillment === 'digital' || !!product.audio_preview_url
  const previewUrl = product.audio_preview_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'

  // Audio Time Update Handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration)
      }
    }
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    audioRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const handlePurchase = () => {
    setAddedStatus('¡Producto añadido a tu biblioteca!')
    setTimeout(() => setAddedStatus(null), 4000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Hidden HTML5 Audio Element */}
      {isMusic && (
        <audio ref={audioRef} src={previewUrl} preload="metadata" />
      )}

      {/* LEFT COLUMN: Amazon-style Thumbnail Viewer with Smooth Zoom (7 Cols on LG) */}
      <div className="lg:col-span-6 space-y-4">
        <div 
          onClick={() => setIsLightboxOpen(true)}
          className="group relative w-full aspect-square rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black cursor-zoom-in transition-all duration-300"
        >
          {product.thumbnail_url ? (
            <Image
              src={product.thumbnail_url}
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
              {product.fulfillment === 'digital' ? 'Lanzamiento Digital' : 'Edición Física'}
            </span>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-500">
          Haz clic sobre la imagen para ampliar en alta resolución
        </p>
      </div>

      {/* RIGHT COLUMN: Title, Pricing, SoundCloud Audio Player, Specs, Purchase (6 Cols on LG) */}
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
              {product.fulfillment === 'digital' ? 'Entrega digital inmediata' : 'Envío rápido disponible'}
            </span>
          </div>
        </div>

        <p className="text-neutral-300 text-sm leading-relaxed border-l-2 border-red-900/60 pl-3">
          {product.description}
        </p>

        {/* SoundCloud Style Audio Preview Player */}
        {isMusic && (
          <div className="bg-gradient-to-r from-red-950/60 via-neutral-950 to-neutral-900 border border-red-900/50 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pausar previsualización' : 'Reproducir previsualización'}
                  className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-900/50 transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold uppercase tracking-wider">
                    <Music className="w-3.5 h-3.5" />
                    <span>Reproductor SoundCloud Preview</span>
                  </div>
                  <p className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-[280px]">
                    {product.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleMute}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/60 transition-colors"
                title={isMuted ? 'Desactivar silencio' : 'Silenciar'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Audio Timeline Scrubber & Equalizer Bars Effect */}
            <div className="space-y-1.5 pt-1">
              <div className="relative flex items-center">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleScrub}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>{formatTime(currentTime)}</span>
                <div className="flex items-center gap-0.5 h-3">
                  {/* Visualizer animation equalizer bars */}
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
          </div>
        )}

        {/* Variant Selector for Physical Products (Hoodies, Merch) */}
        {product.fulfillment === 'physical' && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Seleccionar Talla:
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
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-red-400" />
            Especificaciones Técnicas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {product.specs && Object.keys(product.specs).length > 0 ? (
              Object.entries(product.specs).map(([key, val]) => (
                <div key={key} className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/80">
                  <span className="text-neutral-500 block text-[10px] uppercase">{key}</span>
                  <span className="text-neutral-200 font-semibold">{val}</span>
                </div>
              ))
            ) : (
              <>
                <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/80">
                  <span className="text-neutral-500 block text-[10px] uppercase">Formato</span>
                  <span className="text-neutral-200 font-semibold">{product.fulfillment === 'digital' ? 'Digital Download' : 'Físico'}</span>
                </div>
                <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/80">
                  <span className="text-neutral-500 block text-[10px] uppercase">Estado</span>
                  <span className="text-neutral-200 font-semibold">Disponible</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Purchase & Library CTA Button */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handlePurchase}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-600 active:scale-[0.99] border border-red-500/40 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Comprar Ahora • {formatPrice(product.price_cents, product.currency)}</span>
          </button>

          {addedStatus && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs rounded-xl text-center flex items-center justify-center gap-2 animate-in fade-in duration-300">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{addedStatus}</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-red-500" />
            <span>Pagos seguros. Acceso inmediato en tu Biblioteca de usuario.</span>
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
            {product.thumbnail_url && (
              <Image
                src={product.thumbnail_url}
                alt={product.name}
                fill
                sizes="1000px"
                className="object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
