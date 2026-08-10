'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Pause, Download, Music, Package, Volume2, VolumeX, ShieldCheck, Sparkles } from 'lucide-react'
import { formatPrice, type Product } from '@/lib/types'

type LibraryClientProps = {
  ownedProducts: Product[]
}

export function LibraryClient({ ownedProducts }: LibraryClientProps) {
  const musicProducts = ownedProducts.filter(
    (p) => p.category === 'music' || p.fulfillment === 'digital' || !!p.audio_preview_url
  )
  const physicalProducts = ownedProducts.filter((p) => p.fulfillment === 'physical')

  // Currently playing track index in music list
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const activeTrack = musicProducts[currentTrackIndex] || musicProducts[0]
  const audioSrc = activeTrack?.audio_preview_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'

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
  }, [activeTrack])

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

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index)
    setIsPlaying(true)
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play()
      }
    }, 100)
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

  return (
    <div className="space-y-8">
      {/* Hidden Audio Element */}
      {activeTrack && <audio ref={audioRef} src={audioSrc} preload="metadata" />}

      {/* BUILT-IN WEB PLAYER SECTION (TOP BAR) */}
      {activeTrack && (
        <section className="bg-gradient-to-r from-red-950/80 via-neutral-950 to-neutral-900 border border-red-900/60 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-red-900/40 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Reproductor Web de la Biblioteca
              </h2>
            </div>
            <span className="text-xs font-mono text-red-300 bg-red-950 border border-red-900/60 px-2.5 py-0.5 rounded-full">
              Máster 24-bit / 44.1kHz
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-800 shrink-0">
                <Image
                  src={activeTrack.thumbnail_url || '/images/releases/criss-angel.jpg'}
                  alt={activeTrack.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <h3 className="text-base font-bold text-white line-clamp-1">{activeTrack.name}</h3>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">sleepyred999 • {activeTrack.category}</p>
              </div>
            </div>

            {/* Play Controls & Scrubber */}
            <div className="flex-1 w-full max-w-lg space-y-2">
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-900/60 transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-neutral-400 w-10 text-right">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleScrub}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-500 focus:outline-none"
                />
                <span className="text-[11px] font-mono text-neutral-400 w-10">{formatTime(duration)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleMute}
              className="p-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-900 border border-neutral-800"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </section>
      )}

      {/* MUSIC PURCHASES & DOWNLOADS LIST */}
      {musicProducts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
            <Music className="w-4 h-4 text-red-400" />
            <h2 className="text-lg font-bold text-white">Lanzamientos Musicales Desbloqueados</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {musicProducts.map((product, idx) => (
              <div
                key={product.id}
                className={`border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                  currentTrackIndex === idx
                    ? 'border-red-900/60 bg-red-950/20'
                    : 'border-neutral-800/80 bg-neutral-900/40 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => selectTrack(idx)}
                    className="relative w-14 h-14 rounded-xl overflow-hidden border border-neutral-800 shrink-0 group cursor-pointer"
                  >
                    <Image
                      src={product.thumbnail_url || '/images/releases/criss-angel.jpg'}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-neutral-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 text-white fill-current" />
                    </div>
                  </button>

                  <div>
                    <h3 className="text-base font-bold text-white">{product.name}</h3>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      Licencia Directa • {product.specs?.['Formato Audio'] || 'WAV 24-bit + MP3'}
                    </p>
                  </div>
                </div>

                {/* Offline Download Action Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                  <a
                    href={product.audio_preview_url || '#'}
                    download={`${product.slug || 'song'}-master.wav`}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-red-800 hover:bg-red-700 transition-colors shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar WAV</span>
                  </a>
                  <a
                    href={product.audio_preview_url || '#'}
                    download={`${product.slug || 'song'}-320k.mp3`}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-200 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>MP3 320k</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PHYSICAL ORDERS LIST */}
      {physicalProducts.length > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
            <Package className="w-4 h-4 text-red-400" />
            <h2 className="text-lg font-bold text-white">Pedidos Físicos & Merch</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {physicalProducts.map((product) => (
              <div key={product.id} className="border border-neutral-800/80 rounded-2xl p-4 bg-neutral-900/40 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-neutral-800 shrink-0">
                    <Image
                      src={product.thumbnail_url || '/images/logos/PNG-04.png'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">{product.name}</h3>
                    <span className="text-[10px] font-mono uppercase text-emerald-400 bg-emerald-950 border border-emerald-900 px-2 py-0.5 rounded">
                      Procesado / En camino
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
