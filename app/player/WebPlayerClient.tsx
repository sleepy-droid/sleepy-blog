'use client'

import { useState, useEffect, useRef } from 'react'
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
  PictureInPicture2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  Shuffle,
  Repeat,
  Repeat1,
  GripVertical,
  X,
  RotateCcw,
  ListMusic,
  CornerDownRight,
  ImageDown,
} from 'lucide-react'
import { formatPrice } from '@/lib/types'
import {
  useGlobalPlayer,
  type PlayerTrack,
  type StemMode,
} from '@/lib/player-context'

export type { PlayerTrack }

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
  const {
    tracks: globalTracks,
    activeTrack,
    stemMode,
    isPlaying,
    currentTime,
    duration,
    isMuted,
    isMinimized,
    isPiPActive,
    loopMode,
    setQueue,
    selectAndPlayTrack,
    seek,
    stepTrack,
    toggleMute,
    setIsMinimized,
    togglePiP,
    moveTrackInQueue,
    moveTrackById,
    playNextInQueue,
    removeFromQueue,
    shuffleQueue,
    toggleLoopMode,
  } = useGlobalPlayer()

  const [filterUnlockedOnly, setFilterUnlockedOnly] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const deckRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (tracks.length > 0) {
      setQueue(tracks, initialTrackId)
    }
  }, [tracks, initialTrackId, setQueue])

  const allTracks = globalTracks.length > 0 ? globalTracks : tracks
  const currentTrack =
    activeTrack ||
    (initialTrackId
      ? allTracks.find(
          (t) =>
            t.id === initialTrackId ||
            t.productId === initialTrackId ||
            t.slug === initialTrackId
        )
      : null) ||
    allTracks.find((t) => t.isUnlocked) ||
    allTracks[0] ||
    null

  const visibleTracks = filterUnlockedOnly
    ? allTracks.filter((t) => t.isUnlocked)
    : allTracks

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (!currentTrack) {
    return (
      <div className="p-10 rounded-3xl border border-neutral-800 bg-neutral-950/70 text-center space-y-4">
        <Music className="w-10 h-10 text-neutral-600 mx-auto" />
        <p className="text-sm font-bold text-white">
          No hay pistas disponibles en el reproductor
        </p>
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

  const pid = encodeURIComponent(currentTrack.productId || currentTrack.id)
  const fileParam = currentTrack.fileName
    ? `&file=${encodeURIComponent(currentTrack.fileName)}`
    : ''

  const handlePlayTrack = (
    track: PlayerTrack,
    mode: StemMode = 'master',
    sprawlToDeck = false
  ) => {
    setIsMinimized(false)
    selectAndPlayTrack(track, mode, allTracks)
    if (
      sprawlToDeck &&
      typeof window !== 'undefined' &&
      window.innerWidth < 1024
    ) {
      deckRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleRestoreCatalog = () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('sleepy_player_queue_order_v1')
      } catch {
        // Ignore storage errors
      }
    }
    setQueue(tracks, currentTrack.id)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Columna Izquierda: Consola Maestra de Reproducción */}
      <div
        ref={deckRef}
        className="lg:col-span-7 rounded-3xl border border-red-900/50 bg-gradient-to-br from-neutral-950 via-neutral-900/95 to-neutral-950 p-6 sm:p-8 shadow-2xl space-y-6 scroll-mt-24"
      >
        {/* Cabecera de Estado del Deck + Controles Picture-in-Picture y Minimizar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Disc
              className={`w-4 h-4 text-red-500 ${
                isPlaying ? 'animate-spin' : ''
              }`}
            />
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              sleepyred999 Studio Deck • {stemMode.toUpperCase()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={togglePiP}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                isPiPActive
                  ? 'bg-red-700 text-white border-red-400 shadow-lg shadow-red-950/60'
                  : 'bg-red-950/70 text-red-300 border-red-800/70 hover:bg-red-900/60 hover:text-white'
              }`}
              title="Abrir reproductor en ventana flotante Picture-in-Picture (se mantiene visible aunque cambies de ventana o programa)"
            >
              <PictureInPicture2 className="w-3.5 h-3.5" />
              <span>{isPiPActive ? 'PiP Flotante Activo' : 'Modo PiP Flotante'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border transition-all cursor-pointer ${
                isMinimized
                  ? 'bg-neutral-800 text-white border-neutral-600'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:text-white'
              }`}
              title="Mostrar pestaña minimizada flotante en la esquina"
            >
              <Minimize2 className="w-3 h-3" />
              <span>{isMinimized ? 'Pestaña Activa' : 'Minimizar'}</span>
            </button>

            {currentTrack.isUnlocked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                <Unlock className="w-3 h-3" /> En tu Biblioteca (Descargable)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-red-950/80 text-red-300 border border-red-700/60">
                <Music className="w-3 h-3" /> Streaming Completo
              </span>
            )}
          </div>
        </div>

        {/* Portada y Metadatos */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-neutral-800 bg-neutral-950 shadow-2xl shrink-0">
            <Image
              src={currentTrack.thumbnailUrl}
              alt={currentTrack.title}
              fill
              unoptimized={currentTrack.thumbnailUrl.endsWith('.svg')}
              className="object-cover"
              sizes="176px"
            />
          </div>

          <div className="space-y-3 text-center sm:text-left min-w-0 flex-1">
            <div className="space-y-1">
              <p className="text-xs font-mono uppercase tracking-widest text-red-400 font-bold">
                {currentTrack.artist}
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                {currentTrack.title}
              </h2>
              <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                {currentTrack.description}
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
                  onClick={() => handlePlayTrack(currentTrack, 'master')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    stemMode === 'master'
                      ? 'bg-red-700 text-white border-red-500 shadow-md'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  💿 {currentTrack.isUnlocked ? 'WAV Máster' : 'Pista Completa'}
                </button>

                {currentTrack.mp3Url && (
                  <button
                    type="button"
                    onClick={() => handlePlayTrack(currentTrack, 'mp3')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      stemMode === 'mp3'
                        ? 'bg-red-700 text-white border-red-500 shadow-md'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    🎵 MP3 320k
                  </button>
                )}

                {currentTrack.isUnlocked && currentTrack.acapellaUrl && (
                  <button
                    type="button"
                    onClick={() => handlePlayTrack(currentTrack, 'acapella')}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      stemMode === 'acapella'
                        ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                        : 'bg-neutral-950 text-amber-300 border-amber-900/60 hover:bg-amber-950/40'
                    }`}
                  >
                    <Mic className="w-3 h-3" /> Acapella
                  </button>
                )}

                {currentTrack.isUnlocked && currentTrack.instrumentalUrl && (
                  <button
                    type="button"
                    onClick={() => handlePlayTrack(currentTrack, 'instrumental')}
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
              max={duration > 0 ? duration : 180}
              step={0.1}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600"
            />
            <div className="flex justify-between text-[11px] font-mono text-neutral-400">
              <span>{formatTime(currentTime)}</span>
              <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={toggleMute}
              className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
              title={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
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
                onClick={() => handlePlayTrack(currentTrack, stemMode)}
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

            {currentTrack.videoUrl ? (
              <button
                type="button"
                onClick={() => setShowVideoModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-200 hover:text-white cursor-pointer"
              >
                <Video className="w-4 h-4 text-red-400" />
                <span className="hidden sm:inline">Vídeo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={togglePiP}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                  isPiPActive
                    ? 'bg-red-700 border-red-500 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                }`}
                title="Activar Picture-in-Picture (Ventana Flotante)"
              >
                <PictureInPicture2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Descargas directas verificadas o CTA de compra */}
        <div className="pt-3 border-t border-neutral-800/80">
          {currentTrack.isUnlocked ? (
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-neutral-400 block">
                Descargas directas de tu bóveda personal (WAV / MP3 / Póster 3000×3000):
              </span>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`/api/media/download?productId=${pid}&asset=wav${fileParam}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-red-950/70 border border-red-800/70 text-red-200 hover:bg-red-900/70 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> WAV Máster
                </a>
                <a
                  href={`/api/media/download?productId=${pid}&asset=mp3${fileParam}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> MP3 320k
                </a>
                <a
                  href={`/api/media/download?productId=${pid}&asset=cover`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-amber-950/60 border border-amber-800/60 text-amber-300 hover:bg-amber-900/60 hover:text-white transition-colors"
                  title="Descargar Portada Oficial en 3000x3000 para imprimir como Póster"
                >
                  <ImageDown className="w-3.5 h-3.5" /> Póster 3000×3000
                </a>
                {currentTrack.acapellaUrl && (
                  <a
                    href={`/api/media/download?productId=${pid}&asset=acapella`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-amber-950/50 border border-amber-800/60 text-amber-300 hover:bg-amber-900/50 transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5" /> Acapella
                  </a>
                )}
                {currentTrack.instrumentalUrl && (
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
                Escucha la pista completa gratis. Adquiere este lanzamiento para
                descargar los archivos WAV Máster (24-bit), MP3 320k, Stems y el
                Póster 3000×3000.
              </div>
              <Link
                href={`/shop/${currentTrack.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 shrink-0 shadow-md"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>
                  Obtener Archivos{' '}
                  {currentTrack.priceCents > 0
                    ? formatPrice(currentTrack.priceCents)
                    : ''}
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Cola de Reproducción & Playlist Reordenable */}
      <div className="lg:col-span-5 rounded-3xl border border-neutral-800/90 bg-neutral-950/80 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="space-y-3 border-b border-neutral-800 pb-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Cola & Playlist ({visibleTracks.length})
              </h3>
            </div>

            {isLoggedIn && (
              <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => setFilterUnlockedOnly(false)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    !filterUnlockedOnly
                      ? 'bg-red-700 text-white font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setFilterUnlockedOnly(true)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    filterUnlockedOnly
                      ? 'bg-red-700 text-white font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Mis Másters
                </button>
              </div>
            )}
          </div>

          {/* Controles de Cola: Mezclar, Repetir, Restaurar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-neutral-400">
              Arrastra una canción o usa ↑↓ para ordenar tu cola
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={shuffleQueue}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300 hover:text-white hover:border-red-800/60 cursor-pointer"
                title="Mezclar orden de reproducción"
              >
                <Shuffle className="w-3 h-3 text-red-400" />
                <span>Mezclar</span>
              </button>

              <button
                type="button"
                onClick={toggleLoopMode}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-mono cursor-pointer ${
                  loopMode === 'one'
                    ? 'bg-red-950/80 border-red-700 text-red-200'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                }`}
                title={
                  loopMode === 'one'
                    ? 'Modo actual: Repetir 1 canción'
                    : 'Modo actual: Repetir toda la cola'
                }
              >
                {loopMode === 'one' ? (
                  <>
                    <Repeat1 className="w-3 h-3 text-red-400" />
                    <span>Repetir 1</span>
                  </>
                ) : (
                  <>
                    <Repeat className="w-3 h-3 text-red-400" />
                    <span>Cola</span>
                  </>
                )}
              </button>

              {allTracks.length !== tracks.length && (
                <button
                  type="button"
                  onClick={handleRestoreCatalog}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-400 hover:text-white cursor-pointer"
                  title="Restaurar todas las canciones del catálogo"
                >
                  <RotateCcw className="w-3 h-3 text-red-400" />
                  <span>Restaurar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
          {visibleTracks.map((t, visibleIdx) => {
            const isCurrent = currentTrack.id === t.id
            const globalIdx = allTracks.findIndex((item) => item.id === t.id)
            const isDragOver = dragOverIndex === visibleIdx

            return (
              <div
                key={t.id}
                draggable={!filterUnlockedOnly}
                onDragStart={() => setDragIndex(globalIdx)}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (dragOverIndex !== visibleIdx) setDragOverIndex(visibleIdx)
                }}
                onDragLeave={() => {
                  if (dragOverIndex === visibleIdx) setDragOverIndex(null)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  if (
                    dragIndex !== null &&
                    globalIdx !== -1 &&
                    dragIndex !== globalIdx
                  ) {
                    moveTrackInQueue(dragIndex, globalIdx)
                  }
                  setDragIndex(null)
                  setDragOverIndex(null)
                }}
                onDragEnd={() => {
                  setDragIndex(null)
                  setDragOverIndex(null)
                }}
                className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition-all ${
                  isDragOver
                    ? 'bg-red-950/50 border-red-500 shadow-lg'
                    : isCurrent
                      ? 'bg-red-950/30 border-red-700/70 shadow-md'
                      : 'bg-neutral-900/50 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Drag Handle + Position Number */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className="text-neutral-500 hover:text-neutral-300 cursor-grab active:cursor-grabbing"
                      title="Arrastrar para cambiar el orden"
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500 w-4 text-center">
                      {visibleIdx + 1}
                    </span>
                  </div>

                  {/* Clickable Song Area: Plays song & sprawls back to Studio Deck */}
                  <button
                    type="button"
                    onClick={() => handlePlayTrack(t, 'master', true)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer group"
                  >
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

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={`text-xs font-bold truncate ${
                            isCurrent
                              ? 'text-red-300'
                              : 'text-white group-hover:text-red-200'
                          }`}
                        >
                          {t.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {t.isUnlocked ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                            EN BIBLIOTECA
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-red-300 bg-red-950/60 border border-red-800/50">
                            STREAM
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-neutral-400 truncate">
                          {t.isUnlocked ? 'WAV / MP3 / Póster' : 'Pista Completa'}
                        </span>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Controles de Orden en Playlist (Subir, Bajar, Poner Siguiente, Quitar) */}
                <div className="flex items-center gap-1 shrink-0">
                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => playNextInQueue(t)}
                      className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-300 hover:border-red-800/50 cursor-pointer"
                      title="Reproducir justo después de la canción actual"
                    >
                      <CornerDownRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => moveTrackById(t.id, -1)}
                    disabled={globalIdx <= 0}
                    className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Subir posición en la playlist"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveTrackById(t.id, 1)}
                    disabled={
                      globalIdx === -1 || globalIdx >= allTracks.length - 1
                    }
                    className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Bajar posición en la playlist"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {allTracks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFromQueue(t.id)}
                      className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-500 hover:text-red-400 cursor-pointer"
                      title="Quitar de la cola"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && currentTrack.videoUrl && (
        <div className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-3xl space-y-4 bg-neutral-900 border border-neutral-800 p-4 rounded-3xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">
                {currentTrack.title} — Vídeo Oficial
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
                src={currentTrack.videoUrl}
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
