'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  PictureInPicture2,
  Minimize2,
  Maximize2,
  X,
  Disc,
  Headphones,
  Unlock,
  Mic,
  Sliders,
  ListMusic,
  ChevronUp,
  ChevronDown,
  Shuffle,
  Repeat,
  Repeat1,
  GripVertical,
  Download,
  ImageDown,
  ShoppingBag,
  PanelBottom,
  Sparkles,
} from 'lucide-react'
import { useGlobalPlayer, type StemMode } from '@/lib/player-context'
import { formatPrice } from '@/lib/types'

function formatTime(secs: number) {
  if (!Number.isFinite(secs) || secs < 0) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

/**
 * Self-contained UI rendered inside the OS-level Document Picture-in-Picture floating window.
 * Stays on top even when the user switches browser tabs or switches to other desktop applications.
 */
function DocumentPiPPortalContent({
  onExpandWidget,
}: {
  onExpandWidget: () => void
}) {
  const {
    activeTrack,
    stemMode,
    isPlaying,
    currentTime,
    duration,
    isMuted,
    togglePlay,
    seek,
    stepTrack,
    toggleMute,
    selectAndPlayTrack,
    togglePiP,
  } = useGlobalPlayer()

  if (!activeTrack) return null

  const maxDur = duration > 0 ? duration : 180
  const displayMaxDur = duration > 0 ? formatTime(duration) : '--:--'

  const changeStem = (mode: StemMode) => {
    selectAndPlayTrack(activeTrack, mode)
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '14px 16px',
        background:
          'linear-gradient(145deg, #09090b 0%, #140808 55%, #2b0707 100%)',
        color: '#ffffff',
      }}
    >
      {/* Top Status Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '999px',
              background: isPlaying ? '#ef4444' : '#737373',
              boxShadow: isPlaying ? '0 0 8px #ef4444' : 'none',
            }}
          />
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#fca5a5',
              fontWeight: 700,
            }}
          >
            sleepyred999 PiP • {stemMode.toUpperCase()}
          </span>
        </div>

        <button
          type="button"
          onClick={togglePiP}
          title="Volver a la pestaña principal"
          style={{
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#a3a3a3',
            padding: '2px 7px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.05)',
          }}
        >
          Cerrar PiP ✕
        </button>
      </div>

      {/* Artwork + Track Metadata (Click to expand WebApp Widget) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginTop: '6px',
        }}
      >
        <button
          type="button"
          onClick={onExpandWidget}
          title="Haz clic en la portada para abrir el Widget del Reproductor"
          style={{
            padding: 0,
            border: 'none',
            background: 'transparent',
            flexShrink: 0,
          }}
        >
          <img
            src={activeTrack.thumbnailUrl}
            alt={activeTrack.title}
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '12px',
              objectFit: 'cover',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              flexShrink: 0,
              boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
            }}
          />
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <button
            type="button"
            onClick={onExpandWidget}
            title="Haz clic en la canción para abrir el Widget del Reproductor"
            style={{
              padding: 0,
              border: 'none',
              background: 'transparent',
              textAlign: 'left',
              width: '100%',
              color: 'inherit',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#f87171',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {activeTrack.artist}{' '}
              {activeTrack.isUnlocked ? '• EN BIBLIOTECA' : '• STREAM COMPLETO'} ↗
            </div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: '2px',
              }}
            >
              {activeTrack.title}
            </div>
          </button>

          {/* Stem Switcher Pills inside PiP if unlocked */}
          {activeTrack.isUnlocked && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                marginTop: '6px',
              }}
            >
              {(
                [
                  { id: 'master', label: 'WAV', show: true },
                  { id: 'mp3', label: 'MP3', show: Boolean(activeTrack.mp3Url) },
                  {
                    id: 'acapella',
                    label: 'Vocal',
                    show: Boolean(activeTrack.acapellaUrl),
                  },
                  {
                    id: 'instrumental',
                    label: 'Inst',
                    show: Boolean(activeTrack.instrumentalUrl),
                  },
                ] as const
              )
                .filter((s) => s.show)
                .map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => changeStem(s.id)}
                    style={{
                      fontSize: '9px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '6px',
                      background:
                        stemMode === s.id
                          ? '#dc2626'
                          : 'rgba(255, 255, 255, 0.07)',
                      color: stemMode === s.id ? '#ffffff' : '#d4d4d4',
                      border:
                        stemMode === s.id
                          ? '1px solid #f87171'
                          : '1px solid rgba(255, 255, 255, 0.12)',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Scrubber Bar */}
      <div style={{ marginTop: '8px' }}>
        <input
          type="range"
          min={0}
          max={maxDur}
          step={0.1}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          style={{
            width: '100%',
            height: '5px',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#a3a3a3',
            marginTop: '2px',
          }}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{displayMaxDur}</span>
        </div>
      </div>

      {/* Transport Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '4px',
        }}
      >
        <button
          type="button"
          onClick={toggleMute}
          title={isMuted ? 'Activar sonido' : 'Silenciar'}
          style={{
            padding: '6px 8px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.06)',
            color: isMuted ? '#f87171' : '#d4d4d4',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        >
          {isMuted ? 'MUTE' : 'VOL'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => stepTrack(-1)}
            title="Pista anterior"
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.07)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            ⏮
          </button>

          <button
            type="button"
            onClick={togglePlay}
            title={isPlaying ? 'Pausar' : 'Reproducir'}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              fontWeight: 900,
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.5)',
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button
            type="button"
            onClick={() => stepTrack(1)}
            title="Siguiente pista"
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.07)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            ⏭
          </button>
        </div>

        <button
          type="button"
          onClick={onExpandWidget}
          title="Expandir Widget del Reproductor"
          style={{
            fontSize: '9px',
            fontFamily: 'monospace',
            color: '#fca5a5',
            background: 'rgba(239, 68, 68, 0.14)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '6px',
            padding: '4px 6px',
            fontWeight: 700,
          }}
        >
          EXPANDIR ↗
        </button>
      </div>
    </div>
  )
}

export function GlobalMiniPlayer() {
  const pathname = usePathname()
  const router = useRouter()
  const {
    tracks,
    activeTrack,
    stemMode,
    isPlaying,
    currentTime,
    duration,
    isMuted,
    volume,
    playerViewMode,
    isPiPActive,
    pipContainer,
    loopMode,
    togglePlay,
    seek,
    stepTrack,
    toggleMute,
    setVolume,
    selectAndPlayTrack,
    setPlayerViewMode,
    openExpandedWidget,
    collapseFromWidget,
    togglePiP,
    closePlayer,
    moveTrackInQueue,
    moveTrackById,
    removeFromQueue,
    shuffleQueue,
    toggleLoopMode,
  } = useGlobalPlayer()

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const activeViewContainerRef = useRef<HTMLDivElement | null>(null)

  // Mandatory Accessibility Routing after View Transition between pill / bar / widget
  useEffect(() => {
    if (!activeTrack) return
    const timer = setTimeout(() => {
      activeViewContainerRef.current?.focus({ preventScroll: true })
    }, 30)
    return () => clearTimeout(timer)
  }, [playerViewMode, activeTrack])

  // Close the sprawled widget on Escape key back to the previous compact mode (bar or pill)
  useEffect(() => {
    if (playerViewMode !== 'widget') return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        collapseFromWidget()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [playerViewMode, collapseFromWidget])

  if (!activeTrack) return null

  const isOnDedicatedPlayerPage = pathname === '/player'
  const maxDur = duration > 0 ? duration : 180
  const displayMaxDur = duration > 0 ? formatTime(duration) : '--:--'
  const progressPct = Math.min(100, Math.max(0, (currentTime / maxDur) * 100))

  const pid = encodeURIComponent(activeTrack.productId || activeTrack.id)
  const fileParam = activeTrack.fileName
    ? `&file=${encodeURIComponent(activeTrack.fileName)}`
    : ''

  // Clicking the song in Mini-Mini ('pill') or Mini Bar ('bar') sprawls the WebApp Widget in-place
  // without losing the user's current page or scroll position!
  const handleSprawlInPlace = () => {
    if (typeof window !== 'undefined') {
      window.focus()
    }
    if (isOnDedicatedPlayerPage) {
      setPlayerViewMode('bar')
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }
    openExpandedWidget()
  }

  return (
    <>
      {/* Render Portal inside OS Document Picture-in-Picture window if active */}
      {pipContainer &&
        createPortal(
          <DocumentPiPPortalContent onExpandWidget={handleSprawlInPlace} />,
          pipContainer
        )}

      {/* =====================================================================
          MODE 1: MINI-MINI PLAYER ('pill' — Compact Floating Corner Widget)
          Directly linked to both Mini Bar ('bar') and Sprawled Widget ('widget')
         ===================================================================== */}
      {playerViewMode === 'pill' && (
        <div
          ref={activeViewContainerRef}
          tabIndex={-1}
          aria-label="Mini-mini reproductor flotante"
          style={{ viewTransitionName: 'global-player-shell' }}
          className="fixed bottom-4 right-4 z-50 w-[328px] sm:w-[370px] rounded-2xl border border-red-800/80 bg-neutral-950/95 backdrop-blur-xl shadow-[0_16px_45px_rgba(0,0,0,0.85)] overflow-hidden outline-none"
        >
          {/* Thin live progress bar at top of minimized tab */}
          <div className="w-full h-1 bg-neutral-900">
            <div
              className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="p-3 flex items-center justify-between gap-2.5">
            {/* Clicking the song cover or title sprawls the WebApp Widget right on the current page */}
            <button
              type="button"
              onClick={handleSprawlInPlace}
              title="Ver detalles de la canción (abre el Widget sin salir de esta página)"
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left group cursor-pointer"
            >
              <div
                style={{ viewTransitionName: 'global-player-art' }}
                className="relative w-11 h-11 rounded-xl overflow-hidden border border-red-900/60 group-hover:border-red-500 bg-neutral-900 shrink-0 transition-colors"
              >
                <Image
                  src={activeTrack.thumbnailUrl}
                  alt={activeTrack.title}
                  fill
                  unoptimized={activeTrack.thumbnailUrl.endsWith('.svg')}
                  className={`object-cover ${isPlaying ? 'scale-105' : ''} transition-transform`}
                  sizes="44px"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Disc
                    className={`w-3 h-3 text-red-500 shrink-0 ${
                      isPlaying ? 'animate-spin' : ''
                    }`}
                  />
                  <span className="text-[10px] font-mono uppercase text-red-400 font-bold truncate">
                    {stemMode.toUpperCase()} • {formatTime(currentTime)}
                  </span>
                </div>
                <p className="text-xs font-extrabold text-white group-hover:text-red-300 truncate transition-colors flex items-center gap-1">
                  <span className="truncate">{activeTrack.title}</span>
                  <ChevronUp className="w-3.5 h-3.5 text-red-400 shrink-0" />
                </p>
              </div>
            </button>

            {/* Linked Controls: Play/Pause, Next, Switch to Mini Bar, Expand to Widget, Close */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-md cursor-pointer"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => stepTrack(1)}
                className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 cursor-pointer"
                title="Siguiente pista"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setPlayerViewMode('bar')}
                className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 cursor-pointer"
                title="Pasar a Barra Mini Inferior"
              >
                <PanelBottom className="w-3.5 h-3.5 text-red-400" />
              </button>

              <button
                type="button"
                onClick={handleSprawlInPlace}
                className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-900 cursor-pointer"
                title="Expandir Widget de la Canción"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODE 2: MINI PLAYER BAR ('bar' — Persistent Bottom Dock)
          Clicking the song sprawls the WebApp Widget in-place (like YouTube/Spotify)
         ===================================================================== */}
      {playerViewMode === 'bar' && !isOnDedicatedPlayerPage && (
        <div
          ref={activeViewContainerRef}
          tabIndex={-1}
          aria-label="Barra del reproductor musical"
          style={{ viewTransitionName: 'global-player-shell' }}
          className="fixed bottom-0 inset-x-0 z-50 border-t border-red-900/60 bg-neutral-950/95 backdrop-blur-xl shadow-[0_-12px_40px_rgba(0,0,0,0.9)] outline-none"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex flex-col gap-2.5">
            {/* ROW 1 (TOP): Cover Artwork & Track Name (Click to sprawl WebApp Widget in-place!) + Mode Switcher */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSprawlInPlace}
                title="Haz clic para desplegar el Widget con los detalles, stems y cola sin salir de esta página"
                className="flex items-center gap-3 min-w-0 flex-1 text-left group cursor-pointer"
              >
                <div
                  style={{ viewTransitionName: 'global-player-art' }}
                  className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-xl overflow-hidden border border-red-900/50 group-hover:border-red-500 bg-neutral-900 shrink-0 shadow-lg transition-colors"
                >
                  <Image
                    src={activeTrack.thumbnailUrl}
                    alt={activeTrack.title}
                    fill
                    unoptimized={activeTrack.thumbnailUrl.endsWith('.svg')}
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="52px"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold">
                      {activeTrack.artist}
                    </span>
                    {activeTrack.isUnlocked ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-800/60">
                        <Unlock className="w-2.5 h-2.5" /> En Biblioteca
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-950/90 text-red-300 border border-red-800/60">
                        <Headphones className="w-2.5 h-2.5" /> Stream Completo
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-neutral-400 group-hover:text-red-300 inline-flex items-center gap-0.5 transition-colors">
                      • Ver detalles <ChevronUp className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-extrabold text-white group-hover:text-red-300 truncate transition-colors">
                    {activeTrack.title}
                  </p>
                </div>
              </button>

              {/* Top-Right Linked Mode Controls (Expand Widget, Queue, Mini-Mini Pill & Close) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={openExpandedWidget}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-950/60 border border-red-800/70 text-xs font-mono font-bold text-red-200 hover:bg-red-900/60 hover:text-white cursor-pointer transition-colors"
                  title="Desplegar Widget completo (Detalles, Stems, Descargas y Cola)"
                >
                  <ChevronUp className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden sm:inline">Expandir</span>
                  <span className="text-[10px] text-red-300/80">({tracks.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlayerViewMode('pill')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-white hover:border-neutral-700 cursor-pointer"
                  title="Reducir al Mini-Mini Reproductor flotante en la esquina"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden sm:inline">Mini-Mini</span>
                </button>

                <button
                  type="button"
                  onClick={closePlayer}
                  className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 cursor-pointer"
                  title="Cerrar reproductor"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ROW 2 (MIDDLE): Time Player / Scrubber Timeline */}
            <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400">
              <span className="w-9 text-right text-neutral-300">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={maxDur}
                step={0.1}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                className="flex-1 h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
              <span className="w-9 text-neutral-400">{displayMaxDur}</span>
            </div>

            {/* ROW 3 (BOTTOM): Playback Controls, Stems & Picture-in-Picture */}
            <div className="flex items-center justify-between gap-2">
              {/* Left: Mute + Optional Stems */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                  title={isMuted ? 'Activar sonido' : 'Silenciar'}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                {activeTrack.isUnlocked && (
                  <div className="hidden sm:flex items-center gap-1 pl-1">
                    <button
                      type="button"
                      onClick={() => selectAndPlayTrack(activeTrack, 'master')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border cursor-pointer ${
                        stemMode === 'master'
                          ? 'bg-red-700 text-white border-red-500'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      WAV
                    </button>
                    {activeTrack.acapellaUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          selectAndPlayTrack(activeTrack, 'acapella')
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border cursor-pointer ${
                          stemMode === 'acapella'
                            ? 'bg-amber-600 text-white border-amber-400'
                            : 'bg-neutral-900 text-amber-300 border-amber-900/50'
                        }`}
                      >
                        <Mic className="w-2.5 h-2.5" /> Vocal
                      </button>
                    )}
                    {activeTrack.instrumentalUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          selectAndPlayTrack(activeTrack, 'instrumental')
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border cursor-pointer ${
                          stemMode === 'instrumental'
                            ? 'bg-sky-600 text-white border-sky-400'
                            : 'bg-neutral-900 text-sky-300 border-sky-900/50'
                        }`}
                      >
                        <Sliders className="w-2.5 h-2.5" /> Inst
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Center: Main Transport Buttons (Prev / Play-Pause / Next) */}
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => stepTrack(-1)}
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                  title="Anterior"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white flex items-center justify-center shadow-lg shadow-red-950/60 active:scale-95 transition-transform cursor-pointer"
                  title={isPlaying ? 'Pausar' : 'Reproducir'}
                >
                  {isPlaying ? (
                    <Pause className="w-4.5 h-4.5 fill-current" />
                  ) : (
                    <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => stepTrack(1)}
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                  title="Siguiente"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Right: Picture-in-Picture & Optional Full Page Route */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={togglePiP}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    isPiPActive
                      ? 'bg-red-700 text-white border-red-400 shadow-lg shadow-red-950/60'
                      : 'bg-red-950/60 text-red-300 border-red-800/70 hover:bg-red-900/60 hover:text-white'
                  }`}
                  title="Modo Picture-in-Picture (sigue reproduciendo en ventana flotante aunque cambies de ventana)"
                >
                  <PictureInPicture2 className="w-3.5 h-3.5" />
                  <span>{isPiPActive ? 'PiP Activo' : 'PiP'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/player?track=${encodeURIComponent(
                        activeTrack.productId || activeTrack.id
                      )}`
                    )
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white cursor-pointer"
                  title="Abrir página dedicada /player"
                >
                  <Headphones className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden sm:inline">Página</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODE 3: SPRAWLED WEBAPP WIDGET ('widget' — YouTube / Spotify Overlay)
          Sprawls open over the current page when clicking the song on the mini player,
          and collapses smoothly right back to where you were!
         ===================================================================== */}
      {playerViewMode === 'widget' && !isOnDedicatedPlayerPage && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              collapseFromWidget()
            }
          }}
        >
          <div
            ref={activeViewContainerRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Reproductor expandido: ${activeTrack.title}`}
            style={{ viewTransitionName: 'global-player-shell' }}
            className="w-full max-w-5xl max-h-[90vh] rounded-3xl border border-red-900/70 bg-gradient-to-br from-neutral-950 via-neutral-900/98 to-neutral-950 shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden outline-none"
          >
            {/* Top Window Bar: Seamless 3-Mode Switcher + Collapse Back to Current Page */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-neutral-800/90 bg-neutral-950/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/80 border border-red-800/60 text-[10px] font-mono uppercase tracking-wider text-red-300 font-bold">
                  <Sparkles className="w-3 h-3 text-red-400" />
                  sleepyred999 WebApp Player • {stemMode.toUpperCase()}
                </span>
              </div>

              {/* Linked 3-Tier Mode Switcher (Mini-Mini <-> Mini Bar <-> Expanded Widget) */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPlayerViewMode('pill')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-red-800/60 text-[11px] font-mono text-neutral-300 hover:text-white cursor-pointer transition-colors"
                  title="Minimizar al Mini-Mini Reproductor en la esquina inferior derecha"
                >
                  <Minimize2 className="w-3 h-3 text-red-400" />
                  <span>Mini-Mini</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlayerViewMode('bar')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-red-800/60 text-[11px] font-mono text-neutral-300 hover:text-white cursor-pointer transition-colors"
                  title="Minimizar a la Barra Inferior"
                >
                  <PanelBottom className="w-3 h-3 text-red-400" />
                  <span>Mini Barra</span>
                </button>

                <button
                  type="button"
                  onClick={togglePiP}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold cursor-pointer transition-colors ${
                    isPiPActive
                      ? 'bg-red-700 text-white border-red-400'
                      : 'bg-neutral-900 border-neutral-800 text-red-300 hover:text-white'
                  }`}
                  title="Abrir ventana flotante Picture-in-Picture"
                >
                  <PictureInPicture2 className="w-3 h-3" />
                  <span>PiP</span>
                </button>

                <Link
                  href={`/player?track=${encodeURIComponent(
                    activeTrack.productId || activeTrack.id
                  )}`}
                  onClick={() => setPlayerViewMode('bar')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-[11px] font-mono text-neutral-300 hover:text-white transition-colors"
                  title="Ir a la vista dedicada /player"
                >
                  <Headphones className="w-3 h-3 text-red-400" />
                  <span className="hidden sm:inline">Vista /player</span>
                </Link>

                <button
                  type="button"
                  onClick={collapseFromWidget}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                  title="Minimizar y seguir navegando donde estabas"
                >
                  <ChevronDown className="w-4 h-4" />
                  <span>Minimizar</span>
                </button>
              </div>
            </div>

            {/* Widget Body: 2-Column Spotify/YouTube Console (Song Details + Live Queue) */}
            <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Track Details, Stems, Transport & Downloads */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div
                    style={{ viewTransitionName: 'global-player-art' }}
                    className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-red-900/60 bg-neutral-950 shadow-2xl shrink-0"
                  >
                    <Image
                      src={activeTrack.thumbnailUrl}
                      alt={activeTrack.title}
                      fill
                      unoptimized={activeTrack.thumbnailUrl.endsWith('.svg')}
                      className="object-cover"
                      sizes="176px"
                    />
                  </div>

                  <div className="space-y-2.5 text-center sm:text-left min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="text-xs font-mono uppercase tracking-widest text-red-400 font-bold">
                        {activeTrack.artist}
                      </span>
                      {activeTrack.isUnlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-700/60">
                          <Unlock className="w-3 h-3" /> En tu Biblioteca
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950/90 text-red-300 border border-red-800/60">
                          <Headphones className="w-3 h-3" /> Stream Completo
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      {activeTrack.title}
                    </h2>

                    <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">
                      {activeTrack.description ||
                        'Producción oficial masterizada sin compresión en sleepyred999 Studio.'}
                    </p>

                    {/* Stem Switcher Pills */}
                    <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                      <button
                        type="button"
                        onClick={() => selectAndPlayTrack(activeTrack, 'master')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                          stemMode === 'master'
                            ? 'bg-red-700 text-white border-red-500 shadow-md'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                        }`}
                      >
                        💿 {activeTrack.isUnlocked ? 'WAV Máster' : 'Pista Completa'}
                      </button>

                      {activeTrack.mp3Url && (
                        <button
                          type="button"
                          onClick={() => selectAndPlayTrack(activeTrack, 'mp3')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                            stemMode === 'mp3'
                              ? 'bg-red-700 text-white border-red-500 shadow-md'
                              : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                          }`}
                        >
                          🎵 MP3 320k
                        </button>
                      )}

                      {activeTrack.isUnlocked && activeTrack.acapellaUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            selectAndPlayTrack(activeTrack, 'acapella')
                          }
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                            stemMode === 'acapella'
                              ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                              : 'bg-neutral-900 text-amber-300 border-amber-900/60'
                          }`}
                        >
                          <Mic className="w-3 h-3" /> Acapella
                        </button>
                      )}

                      {activeTrack.isUnlocked && activeTrack.instrumentalUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            selectAndPlayTrack(activeTrack, 'instrumental')
                          }
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                            stemMode === 'instrumental'
                              ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                              : 'bg-neutral-900 text-sky-300 border-sky-900/60'
                          }`}
                        >
                          <Sliders className="w-3 h-3" /> Instrumental
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scrubber & Transport Console */}
                <div className="p-4 rounded-2xl bg-neutral-950/90 border border-neutral-800/90 space-y-4">
                  <div className="space-y-1.5">
                    <input
                      type="range"
                      min={0}
                      max={maxDur}
                      step={0.1}
                      value={currentTime}
                      onChange={(e) => seek(Number(e.target.value))}
                      className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span>{formatTime(currentTime)}</span>
                      <span className="text-red-400 font-bold uppercase">
                        {stemMode}
                      </span>
                      <span>{displayMaxDur}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Volume Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                        title={isMuted ? 'Activar sonido' : 'Silenciar'}
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4 text-red-400" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-20 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-500 hidden sm:block"
                        title="Volumen"
                      />
                    </div>

                    {/* Center Transport */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={shuffleQueue}
                        className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                        title="Mezclar cola"
                      >
                        <Shuffle className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => stepTrack(-1)}
                        className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white cursor-pointer"
                        title="Pista anterior"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={togglePlay}
                        className="w-12 h-12 rounded-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white flex items-center justify-center shadow-lg shadow-red-950/60 active:scale-95 transition-transform cursor-pointer"
                        title={isPlaying ? 'Pausar' : 'Reproducir'}
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => stepTrack(1)}
                        className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white cursor-pointer"
                        title="Siguiente pista"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={toggleLoopMode}
                        className={`p-2 rounded-xl border cursor-pointer ${
                          loopMode === 'one'
                            ? 'bg-red-950/80 border-red-700 text-red-300'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                        title={
                          loopMode === 'one'
                            ? 'Repetir canción actual'
                            : 'Repetir toda la cola'
                        }
                      >
                        {loopMode === 'one' ? (
                          <Repeat1 className="w-4 h-4 text-red-400" />
                        ) : (
                          <Repeat className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="text-[11px] font-mono text-neutral-500 hidden sm:block">
                      {tracks.findIndex((t) => t.id === activeTrack.id) + 1} /{' '}
                      {tracks.length}
                    </div>
                  </div>
                </div>

                {/* Direct Downloads or Unlock Box inside Widget */}
                {activeTrack.isUnlocked ? (
                  <div className="p-3.5 rounded-2xl border border-neutral-800/80 bg-neutral-900/40 space-y-2.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">
                      Descargas Directas de tu Biblioteca:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`/api/media/download?productId=${pid}&asset=wav${fileParam}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-600 text-white transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>WAV Máster</span>
                      </a>
                      <a
                        href={`/api/media/download?productId=${pid}&asset=mp3${fileParam}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-red-400" />
                        <span>MP3 320k</span>
                      </a>
                      <a
                        href={`/api/media/download?productId=${pid}&asset=cover`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-700/50 transition-colors"
                      >
                        <ImageDown className="w-3.5 h-3.5 text-purple-300" />
                        <span>Póster 3000×3000</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl border border-red-900/40 bg-red-950/20 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white">
                        Descarga el WAV Máster, MP3 320k y Póster 3000×3000
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Desbloquea los archivos de estudio y su portada para tu perfil.
                      </p>
                    </div>
                    <Link
                      href={`/shop/${activeTrack.slug}`}
                      onClick={() => collapseFromWidget()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-colors shrink-0"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>
                        Desbloquear ({formatPrice(activeTrack.priceCents, 'USD')})
                      </span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Right Column: Live Reorderable Queue / Playlist */}
              <div className="lg:col-span-5 rounded-2xl border border-neutral-800/90 bg-neutral-950/80 p-4 space-y-3 max-h-[380px] overflow-y-auto">
                <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ListMusic className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                      Cola de Reproducción ({tracks.length})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">
                    Arrastra o usa ↑↓
                  </span>
                </div>

                <div className="space-y-1.5">
                  {tracks.map((track, idx) => {
                    const isCurrent = track.id === activeTrack.id
                    const isDragOver = dragOverIndex === idx
                    return (
                      <div
                        key={track.id}
                        draggable
                        onDragStart={() => setDragIndex(idx)}
                        onDragOver={(e) => {
                          e.preventDefault()
                          if (dragOverIndex !== idx) setDragOverIndex(idx)
                        }}
                        onDragLeave={() => {
                          if (dragOverIndex === idx) setDragOverIndex(null)
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          if (dragIndex !== null && dragIndex !== idx) {
                            moveTrackInQueue(dragIndex, idx)
                          }
                          setDragIndex(null)
                          setDragOverIndex(null)
                        }}
                        onDragEnd={() => {
                          setDragIndex(null)
                          setDragOverIndex(null)
                        }}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all ${
                          isDragOver
                            ? 'border-red-500 bg-red-950/40'
                            : isCurrent
                              ? 'border-red-700/70 bg-red-950/30'
                              : 'border-neutral-900 bg-neutral-900/50 hover:border-neutral-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-neutral-500 cursor-grab active:cursor-grabbing shrink-0">
                            <GripVertical className="w-3.5 h-3.5" />
                          </span>

                          <button
                            type="button"
                            onClick={() => selectAndPlayTrack(track)}
                            className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group"
                          >
                            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-neutral-800 shrink-0 bg-neutral-900">
                              <Image
                                src={track.thumbnailUrl}
                                alt={track.title}
                                fill
                                unoptimized={track.thumbnailUrl.endsWith('.svg')}
                                className="object-cover"
                                sizes="36px"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-xs font-bold truncate ${
                                  isCurrent
                                    ? 'text-red-300'
                                    : 'text-white group-hover:text-red-200'
                                }`}
                              >
                                {track.title}
                              </p>
                              <p className="text-[10px] font-mono text-neutral-400 truncate">
                                {track.isUnlocked ? 'En Biblioteca' : 'Stream'}
                              </p>
                            </div>
                          </button>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveTrackById(track.id, -1)}
                            disabled={idx === 0}
                            className="p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Subir"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveTrackById(track.id, 1)}
                            disabled={idx === tracks.length - 1}
                            className="p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Bajar"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          {tracks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFromQueue(track.id)}
                              className="p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 cursor-pointer"
                              title="Quitar"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
