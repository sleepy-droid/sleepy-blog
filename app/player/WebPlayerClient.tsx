'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Lock,
  Unlock,
  Mic,
  Sliders,
  Disc,
  Music,
  Video,
  ShoppingBag,
} from 'lucide-react'
import { formatPrice } from '@/lib/types'

export type PlayerTrack = {
  id: string
  slug: string
  title: string
  artist: string
  description: string
  thumbnailUrl: string
  wavUrl: string | null
  mp3Url: string | null
  previewUrl: string | null
  acapellaUrl: string | null
  instrumentalUrl: string | null
  videoUrl: string | null
  isUnlocked: boolean
  priceCents: number
}

type StemMode = 'master' | 'mp3' | 'acapella' | 'instrumental'

type WebPlayerClientProps = {
  tracks: PlayerTrack[]
  initialTrackId: string | null
  isLoggedIn: boolean
}

export function WebPlayerClient({
  tracks,
  initialTrackId,
  isLoggedIn,
}: WebPlayerClientProps) {
  const initialTrack =
    (initialTrackId
      ? tracks.find((t) => t.id === initialTrackId || t.slug === initialTrackId)
      : null) ||
    tracks.find((t) => t.isUnlocked) ||
    tracks[0] ||
    null

  const [activeTrack, setActiveTrack] = useState<PlayerTrack | null>(initialTrack)
  const [stemMode, setStemMode] = useState<StemMode>('master')
  const [filterUnlockedOnly, setFilterUnlockedOnly] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const resolveAudioSource = (track: PlayerTrack | null, mode: StemMode): string => {
    if (!track) return ''
    if (!track.isUnlocked) {
      return track.previewUrl || track.mp3Url || ''
    }
    switch (mode) {
      case 'acapella':
        return track.acapellaUrl || track.wavUrl || track.mp3Url || track.previewUrl || ''
      case 'instrumental':
        return track.instrumentalUrl || track.wavUrl || track.mp3Url || track.previewUrl || ''
      case 'mp3':
        return track.mp3Url || track.previewUrl || track.wavUrl || ''
      case 'master':
      default:
        return track.wavUrl || track.mp3Url || track.previewUrl || ''
    }
  }

  const currentAudioUrl = resolveAudioSource(activeTrack, stemMode)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      // Si la pista no está desbloqueada, limitar preview a 30 segundos
      if (activeTrack && !activeTrack.isUnlocked && audio.currentTime >= 30) {
        audio.pause()
        audio.currentTime = 0
        setIsPlaying(false)
        setCurrentTime(0)
        return
      }
      setCurrentTime(audio.currentTime)
    }
    const updateDuration = () => {
      const rawDur = audio.duration || 0
      setDuration(activeTrack && !activeTrack.isUnlocked ? Math.min(rawDur || 30, 30) : rawDur)
    }
    const onEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', onEnded)
    }
  }, [activeTrack, stemMode])

  const selectAndPlayTrack = (track: PlayerTrack, newStem: StemMode = 'master') => {
    const isSameTrack = activeTrack?.id === track.id && stemMode === newStem
    if (isSameTrack) {
      if (isPlaying) {
        audioRef.current?.pause()
        setIsPlaying(false)
      } else {
        audioRef.current
          ?.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false))
      }
      return
    }

    setActiveTrack(track)
    setStemMode(newStem)
    setCurrentTime(0)
    setIsPlaying(true)
    setTimeout(() => {
      audioRef.current
        ?.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false))
    }, 80)
  }

  const visibleTracks = filterUnlockedOnly
    ? tracks.filter((t) => t.isUnlocked)
    : tracks

  const stepTrack = (direction: -1 | 1) => {
    if (visibleTracks.length === 0 || !activeTrack) return
    const idx = visibleTracks.findIndex((t) => t.id === activeTrack.id)
    const nextIdx =
      idx === -1
        ? 0
        : (idx + direction + visibleTracks.length) % visibleTracks.length
    selectAndPlayTrack(visibleTracks[nextIdx], 'master')
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    audioRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (!activeTrack) {
    return (
      <div className="p-10 rounded-3xl border border-neutral-800 bg-neutral-950/70 text-center space-y-4">
        <Music className="w-10 h-10 text-neutral-600 mx-auto" />
        <p className="text-sm font-bold text-white">No hay pistas disponibles en el reproductor</p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Explorar Catálogo Musical</span>
        </Link>
      </div>
    )
  }

  const pid = encodeURIComponent(activeTrack.id)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {currentAudioUrl && (
        <audio ref={audioRef} src={currentAudioUrl} preload="metadata" />
      )}

      {/* Columna Izquierda: Consola Maestra de Reproducción */}
      <div className="lg:col-span-7 rounded-3xl border border-red-900/50 bg-gradient-to-br from-neutral-950 via-neutral-900/95 to-neutral-950 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Cabecera de Estado del Deck */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Disc
              className={`w-4 h-4 text-red-500 ${isPlaying ? 'animate-spin' : ''}`}
            />
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              sleepyred999 Studio Deck • {stemMode.toUpperCase()}
            </span>
          </div>

          {activeTrack.isUnlocked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
              <Unlock className="w-3 h-3" /> Máster Desbloqueado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60">
              <Lock className="w-3 h-3" /> Preview 30s
            </span>
          )}
        </div>

        {/* Portada y Metadatos */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-neutral-800 bg-neutral-950 shadow-2xl shrink-0">
            <Image
              src={activeTrack.thumbnailUrl}
              alt={activeTrack.title}
              fill
              unoptimized={activeTrack.thumbnailUrl.endsWith('.svg')}
              className="object-cover"
              sizes="176px"
            />
          </div>

          <div className="space-y-3 text-center sm:text-left min-w-0 flex-1">
            <div className="space-y-1">
              <p className="text-xs font-mono uppercase tracking-widest text-red-400 font-bold">
                {activeTrack.artist}
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                {activeTrack.title}
              </h2>
              <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                {activeTrack.description}
              </p>
            </div>

            {/* Selector de Stems (Máster WAV / MP3 / Acapella / Instrumental) */}
            <div className="pt-1 space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-neutral-500 block">
                Canal de Audio Activo:
              </span>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => selectAndPlayTrack(activeTrack, 'master')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    stemMode === 'master'
                      ? 'bg-red-700 text-white border-red-500 shadow-md'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  💿 {activeTrack.isUnlocked ? 'WAV Máster' : 'Preview 30s'}
                </button>

                {activeTrack.isUnlocked && activeTrack.mp3Url && (
                  <button
                    type="button"
                    onClick={() => selectAndPlayTrack(activeTrack, 'mp3')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      stemMode === 'mp3'
                        ? 'bg-red-700 text-white border-red-500 shadow-md'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    🎵 MP3 320k
                  </button>
                )}

                {activeTrack.isUnlocked && activeTrack.acapellaUrl && (
                  <button
                    type="button"
                    onClick={() => selectAndPlayTrack(activeTrack, 'acapella')}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      stemMode === 'acapella'
                        ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                        : 'bg-neutral-950 text-amber-300 border-amber-900/60 hover:bg-amber-950/40'
                    }`}
                  >
                    <Mic className="w-3 h-3" /> Acapella
                  </button>
                )}

                {activeTrack.isUnlocked && activeTrack.instrumentalUrl && (
                  <button
                    type="button"
                    onClick={() => selectAndPlayTrack(activeTrack, 'instrumental')}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      stemMode === 'instrumental'
                        ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                        : 'bg-neutral-950 text-sky-300 border-sky-900/60 hover:bg-sky-950/40'
                    }`}
                  >
                    <Sliders className="w-3 h-3" /> Instrumental
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Progreso y Transporte */}
        <div className="space-y-3 pt-2 border-t border-neutral-800/80">
          <div className="space-y-1.5">
            <input
              type="range"
              min={0}
              max={duration || 30}
              step={0.1}
              value={currentTime}
              onChange={(e) => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Number(e.target.value)
                  setCurrentTime(Number(e.target.value))
                }
              }}
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <div className="flex justify-between text-[11px] font-mono text-neutral-400">
              <span>{formatTime(currentTime)}</span>
              <span>
                {activeTrack.isUnlocked
                  ? formatTime(duration)
                  : `${formatTime(duration || 30)} (Snippet)`}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={toggleMute}
              className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
              title={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => stepTrack(-1)}
                className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                title="Pista anterior"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => selectAndPlayTrack(activeTrack, stemMode)}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white flex items-center justify-center shadow-xl shadow-red-950/60 transition-transform active:scale-95 cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => stepTrack(1)}
                className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                title="Siguiente pista"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {activeTrack.videoUrl ? (
              <button
                type="button"
                onClick={() => setShowVideoModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-200 hover:text-white cursor-pointer"
              >
                <Video className="w-4 h-4 text-red-400" />
                <span className="hidden sm:inline">Vídeo</span>
              </button>
            ) : (
              <div className="w-9" />
            )}
          </div>
        </div>

        {/* Descargas directas verificadas o CTA de compra */}
        <div className="pt-3 border-t border-neutral-800/80">
          {activeTrack.isUnlocked ? (
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-neutral-400 block">
                Descargas directas de tu bóveda personal:
              </span>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/api/media/download?productId=${pid}&asset=wav`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-red-950/70 border border-red-800/70 text-red-200 hover:bg-red-900/70 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> WAV Máster
                </a>
                <a
                  href={`/api/media/download?productId=${pid}&asset=mp3`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> MP3 320k
                </a>
                {activeTrack.acapellaUrl && (
                  <a
                    href={`/api/media/download?productId=${pid}&asset=acapella`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-amber-950/50 border border-amber-800/60 text-amber-300 hover:bg-amber-900/50 transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5" /> Acapella
                  </a>
                )}
                {activeTrack.instrumentalUrl && (
                  <a
                    href={`/api/media/download?productId=${pid}&asset=instrumental`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-sky-950/50 border border-sky-800/60 text-sky-300 hover:bg-sky-900/50 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" /> Instrumental
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800">
              <div className="text-xs text-neutral-300">
                Estás escuchando el preview de 30s. Desbloquea el máster WAV completo y stems en la tienda.
              </div>
              <Link
                href={`/shop/${activeTrack.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 shrink-0 shadow-md"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>
                  Desbloquear {activeTrack.priceCents > 0 ? formatPrice(activeTrack.priceCents) : ''}
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Lista de Pistas del Reproductor */}
      <div className="lg:col-span-5 rounded-3xl border border-neutral-800/90 bg-neutral-950/80 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Pistas ({visibleTracks.length})
          </h3>

          {isLoggedIn && (
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setFilterUnlockedOnly(false)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  !filterUnlockedOnly ? 'bg-red-700 text-white font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setFilterUnlockedOnly(true)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  filterUnlockedOnly ? 'bg-red-700 text-white font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Mis Másters
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
          {visibleTracks.map((t) => {
            const isCurrent = activeTrack.id === t.id
            return (
              <div
                key={t.id}
                onClick={() => selectAndPlayTrack(t, 'master')}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-red-950/30 border-red-700/70 shadow-md'
                    : 'bg-neutral-900/50 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0">
                    <Image
                      src={t.thumbnailUrl}
                      alt={t.title}
                      fill
                      unoptimized={t.thumbnailUrl.endsWith('.svg')}
                      className="object-cover"
                      sizes="44px"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 text-white fill-current" />
                      ) : (
                        <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{t.title}</p>
                    <p className="text-[10px] font-mono text-neutral-400 truncate">
                      {t.isUnlocked ? 'WAV / MP3 / Stems Desbloqueados' : 'Preview 30s'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {t.isUnlocked ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                      MÁSTER
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-800/50">
                      30s
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && activeTrack.videoUrl && (
        <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-3xl space-y-4 bg-neutral-900 border border-neutral-800 p-4 rounded-3xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">
                {activeTrack.title} — Vídeo Oficial
              </h3>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                Cerrar ✕
              </button>
            </div>
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black">
              <iframe
                src={activeTrack.videoUrl}
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
