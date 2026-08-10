'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Play, Pause, Download, Video, Music, Package, Sparkles, Check, ChevronDown, Clock, ShieldCheck } from 'lucide-react'
import { formatPrice, type LibraryItem, type Product } from '@/lib/types'

export type PhysicalOrderType = {
  id: string
  product: Product
  variantLabel: string
  quantity: number
  status: 'processing' | 'shipped' | 'delivered'
  created_at: string
}

type LibraryClientProps = {
  digitalItems: Array<LibraryItem & { product: Product }>
  physicalOrders: PhysicalOrderType[]
}

export function LibraryClient({ digitalItems, physicalOrders }: LibraryClientProps) {
  // Audio Player State
  const [activeItem, setActiveItem] = useState<(LibraryItem & { product: Product }) | null>(digitalItems[0] || null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showVideoModal, setShowVideoModal] = useState(false)

  // Download Dropdown Toggle
  const [openDownloadId, setOpenDownloadId] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const currentAudioUrl = activeItem?.product?.wav_url || activeItem?.product?.mp3_url || activeItem?.product?.audio_preview_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration || 0)
    const onEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', onEnded)
    }
  }, [activeItem])

  const togglePlay = (item: LibraryItem & { product: Product }) => {
    if (activeItem?.id === item.id) {
      if (isPlaying) {
        audioRef.current?.pause()
        setIsPlaying(false)
      } else {
        audioRef.current?.play()
        setIsPlaying(true)
      }
    } else {
      setActiveItem(item)
      setIsPlaying(true)
      setTimeout(() => audioRef.current?.play(), 100)
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const getStatusBadge = (status: PhysicalOrderType['status']) => {
    switch (status) {
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-800/80">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Procesando
          </span>
        )
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-yellow-950/80 text-yellow-400 border border-yellow-800/80">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
            Enviado
          </span>
        )
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <Check className="w-3.5 h-3.5" />
            Entregado
          </span>
        )
    }
  }

  return (
    <div className="space-y-12">
      {/* Hidden Audio Tag */}
      {activeItem && <audio ref={audioRef} src={currentAudioUrl} preload="metadata" />}

      {/* Discrete Sticky Audio/Video Player Bar (Appears when activeItem is playing) */}
      {activeItem && (
        <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-red-900/60 p-4 rounded-2xl shadow-2xl space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Circular Play / Pause Button */}
              <button
                onClick={() => togglePlay(activeItem)}
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-950 transition-transform active:scale-95 cursor-pointer shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-mono uppercase text-red-400 font-bold block">Reproduciendo de tu biblioteca</span>
                <h3 className="text-sm font-bold text-white truncate">{activeItem.product.name}</h3>
              </div>
            </div>

            {/* Video button if available */}
            {activeItem.product.video_url && (
              <button
                onClick={() => setShowVideoModal(true)}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5 text-red-400" />
                <span>Ver Vídeo</span>
              </button>
            )}
          </div>

          {/* Expanding Time Scrubber Bar when playing */}
          {isPlaying && (
            <div className="space-y-1 pt-1 animate-in fade-in duration-300">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  if (audioRef.current) audioRef.current.currentTime = Number(e.target.value)
                }}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 1: Music Releases & Digital Downloads */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
          <Music className="w-5 h-5 text-red-500" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Lanzamientos Musicales Digitales ({digitalItems.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {digitalItems.map((item) => {
            const isCurrent = activeItem?.id === item.id
            const isMenuOpen = openDownloadId === item.id

            return (
              <div
                key={item.id}
                className={`border rounded-2xl p-4 flex items-center justify-between gap-4 transition-all ${
                  isCurrent ? 'bg-neutral-900/80 border-red-900/80 shadow-lg' : 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Circular Play Icon for individual track */}
                  <button
                    onClick={() => togglePlay(item)}
                    className="w-10 h-10 rounded-full bg-neutral-900 hover:bg-red-950 border border-neutral-800 hover:border-red-800 text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="w-4 h-4 text-red-400 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 text-red-400 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{item.product.name}</h3>
                    <p className="text-[11px] font-mono text-neutral-500">
                      Adquirido el {new Date(item.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>

                {/* Download Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setOpenDownloadId(isMenuOpen ? null : item.id)}
                    className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1 text-xs cursor-pointer"
                    title="Opciones de descarga"
                  >
                    <Download className="w-4 h-4 text-red-400" />
                    <ChevronDown className="w-3 h-3 text-neutral-500" />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-1.5 z-20 space-y-1 text-xs font-mono">
                      <a
                        href={item.product.mp3_url || currentAudioUrl}
                        download
                        className="block w-full px-3 py-2 rounded-lg hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors"
                      >
                        Descargar MP3 320k
                      </a>
                      <a
                        href={item.product.wav_url || currentAudioUrl}
                        download
                        className="block w-full px-3 py-2 rounded-lg hover:bg-neutral-900 text-red-400 hover:text-red-300 font-bold transition-colors"
                      >
                        Descargar WAV Máster
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* SECTION 2: Physical Merch Orders Tracking (Traffic Light Badges) */}
      <section className="space-y-4 pt-4 border-t border-neutral-900">
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
          <Package className="w-5 h-5 text-red-500" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Pedidos Físicos y Prendas ({physicalOrders.length})
          </h2>
        </div>

        <div className="space-y-3">
          {physicalOrders.map((order) => (
            <div
              key={order.id}
              className="border border-neutral-800/80 bg-neutral-950/60 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                  {order.product.thumbnail_url ? (
                    <Image src={order.product.thumbnail_url} alt={order.product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600">
                      Prenda
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">{order.product.name}</h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
                    <span>Talla: <strong className="text-white">{order.variantLabel}</strong></span>
                    <span>Cantidad: <strong className="text-white">{order.quantity}</strong></span>
                    <span>ID: <strong className="text-neutral-500">#{order.id.slice(0, 8)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Status Badge Traffic Light */}
              <div className="flex items-center justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                {getStatusBadge(order.status)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Video Modal (if user clicks video button) */}
      {showVideoModal && activeItem?.product?.video_url && (
        <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-3xl space-y-4 bg-neutral-900 border border-neutral-800 p-4 rounded-3xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">{activeItem.product.name} — Vídeo Oficial</h3>
              <button onClick={() => setShowVideoModal(false)} className="text-neutral-400 hover:text-white text-xs">
                Cerrar ✕
              </button>
            </div>
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black">
              <iframe
                src={activeItem.product.video_url}
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
