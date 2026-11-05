'use client'

import React, { useState } from 'react'
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
  Lock,
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
  ExternalLink,
} from 'lucide-react'
import { useGlobalPlayer, type StemMode } from '@/lib/player-context'

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
  onSprawlToPlayer,
}: {
  onSprawlToPlayer: () => void
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

  const maxDur = duration > 0 ? duration : activeTrack.isUnlocked ? 180 : 30
  const displayMaxDur = activeTrack.isUnlocked
    ? duration > 0
      ? formatTime(duration)
      : '--:--'
    : formatTime(duration || 30)

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

      {/* Artwork + Track Metadata (Click to sprawl back to Web Player) */}
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
          onClick={onSprawlToPlayer}
          title="Haz clic en la portada para abrir el Web Player completo"
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
            onClick={onSprawlToPlayer}
            title="Haz clic en la canción para abrir el Web Player"
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
              {activeTrack.isUnlocked ? '• MÁSTER' : '• PREVIEW 30S'} ↗
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
          onClick={onSprawlToPlayer}
          title="Abrir en el Web Player"
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
          ABRIR ↗
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
    isMinimized,
    isPiPActive,
    pipContainer,
    loopMode,
    togglePlay,
    seek,
    stepTrack,
    toggleMute,
    selectAndPlayTrack,
    setIsMinimized,
    togglePiP,
    closePlayer,
    moveTrackInQueue,
    moveTrackById,
    removeFromQueue,
    shuffleQueue,
    toggleLoopMode,
  } = useGlobalPlayer()

  const [showQueueDrawer, setShowQueueDrawer] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  if (!activeTrack) return null

  const isOnDedicatedPlayerPage = pathname === '/player'
  const maxDur = duration > 0 ? duration : activeTrack.isUnlocked ? 180 : 30
  const displayMaxDur = activeTrack.isUnlocked
    ? duration > 0
      ? formatTime(duration)
      : '--:--'
    : formatTime(duration || 30)
  const progressPct = Math.min(100, Math.max(0, (currentTime / maxDur) * 100))

  // Sprawl back to the full Web Player console when clicking the song cover or title
  const sprawlToWebPlayer = () => {
    setIsMinimized(false)
    setShowQueueDrawer(false)
    if (typeof window !== 'undefined') {
      window.focus()
    }
    const targetUrl = `/player?track=${encodeURIComponent(
      activeTrack.productId || activeTrack.id
    )}`
    if (pathname !== '/player') {
      router.push(targetUrl)
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* Render Portal inside OS Document Picture-in-Picture window if active */}
      {pipContainer &&
        createPortal(
          <DocumentPiPPortalContent onSprawlToPlayer={sprawlToWebPlayer} />,
          pipContainer
        )}

      {/* Minimized Floating Tab Mode (Bottom-Right Corner Widget) */}
      {isMinimized ? (
        <div className="fixed bottom-4 right-4 z-50 w-[320px] sm:w-[355px] rounded-2xl border border-red-800/70 bg-neutral-950/95 backdrop-blur-xl shadow-2xl shadow-red-950/50 overflow-hidden transition-all">
          {/* Thin live progress bar at top of minimized tab */}
          <div className="w-full h-1 bg-neutral-900">
            <div
              className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="p-3 flex items-center justify-between gap-2.5">
            {/* Clicking the song cover or title sprawls directly back to the full Web Player */}
            <button
              type="button"
              onClick={sprawlToWebPlayer}
              title="Haz clic en la canción para abrir el Web Player completo"
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left group cursor-pointer"
            >
              <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-red-900/60 group-hover:border-red-500 bg-neutral-900 shrink-0 transition-colors">
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
                  <ExternalLink className="w-3 h-3 text-red-400 opacity-75 group-hover:opacity-100 shrink-0" />
                </p>
              </div>
            </button>

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
                onClick={togglePiP}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isPiPActive
                    ? 'bg-red-700 text-white border-red-500'
                    : 'text-red-400 border-red-900/50 hover:bg-red-950/60'
                }`}
                title="Abrir Picture-in-Picture (se mantiene flotando al cambiar de ventana)"
              >
                <PictureInPicture2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsMinimized(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 cursor-pointer"
                title="Expandir barra del reproductor"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Expanded Persistent Floating Player Dock at Bottom of Viewport */
        !isOnDedicatedPlayerPage && (
          <div className="fixed bottom-0 inset-x-0 z-50 border-t border-red-900/60 bg-neutral-950/95 backdrop-blur-xl shadow-[0_-12px_40px_rgba(0,0,0,0.9)]">
            {/* Expandable Queue / Playlist Reorder Drawer */}
            {showQueueDrawer && (
              <div className="border-b border-red-900/50 bg-neutral-950/98 max-h-[55vh] overflow-y-auto">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-900 pb-2.5">
                    <div className="flex items-center gap-2">
                      <ListMusic className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                        Cola de Reproducción ({tracks.length})
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500 hidden sm:inline">
                        Arrastra o usa ↑↓ para reordenar tu playlist
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={shuffleQueue}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300 hover:text-white hover:border-red-800/60 cursor-pointer"
                        title="Mezclar orden de la cola"
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
                            ? 'Modo: Repetir canción actual'
                            : 'Modo: Repetir toda la cola'
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

                      <button
                        type="button"
                        onClick={sprawlToWebPlayer}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-800/60 text-[11px] font-mono text-red-200 hover:bg-red-900/60 cursor-pointer"
                      >
                        <Headphones className="w-3 h-3" />
                        <span>Abrir Web Player</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowQueueDrawer(false)}
                        className="p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                        title="Cerrar cola"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Reorderable Track List */}
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
                          className={`flex items-center justify-between gap-2.5 p-2 rounded-xl border transition-all ${
                            isDragOver
                              ? 'border-red-500 bg-red-950/40'
                              : isCurrent
                                ? 'border-red-700/70 bg-red-950/25'
                                : 'border-neutral-900 bg-neutral-900/50 hover:border-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span
                              className="text-neutral-500 hover:text-neutral-300 cursor-grab active:cursor-grabbing shrink-0"
                              title="Arrastrar para reordenar"
                            >
                              <GripVertical className="w-4 h-4" />
                            </span>

                            <span className="text-[11px] font-mono text-neutral-500 w-5 text-center shrink-0">
                              {idx + 1}
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
                                  {track.artist} •{' '}
                                  {track.isUnlocked ? 'Máster' : 'Preview 30s'}
                                </p>
                              </div>
                            </button>
                          </div>

                          {/* Reorder Up / Down & Remove buttons */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => moveTrackById(track.id, -1)}
                              disabled={idx === 0}
                              className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
                              title="Subir en la cola"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveTrackById(track.id, 1)}
                              disabled={idx === tracks.length - 1}
                              className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
                              title="Bajar en la cola"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            {tracks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeFromQueue(track.id)}
                                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 cursor-pointer"
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
              </div>
            )}

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col gap-3">
              {/* ROW 1 (TOP): Cover Artwork & Track Name (Click to sprawl to Web Player) + Minimize/Close */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={sprawlToWebPlayer}
                  title="Haz clic en la canción para abrir el Web Player completo"
                  className="flex items-center gap-3 min-w-0 flex-1 text-left group cursor-pointer"
                >
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-red-900/50 group-hover:border-red-500 bg-neutral-900 shrink-0 shadow-lg transition-colors">
                    <Image
                      src={activeTrack.thumbnailUrl}
                      alt={activeTrack.title}
                      fill
                      unoptimized={activeTrack.thumbnailUrl.endsWith('.svg')}
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="56px"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold">
                        {activeTrack.artist}
                      </span>
                      {activeTrack.isUnlocked ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-800/60">
                          <Unlock className="w-2.5 h-2.5" /> Máster
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-800/60">
                          <Lock className="w-2.5 h-2.5" /> Preview 30s
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-neutral-400 group-hover:text-red-300 inline-flex items-center gap-1 transition-colors">
                        • Ir al Player <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                    <p className="text-sm sm:text-base font-extrabold text-white group-hover:text-red-300 truncate transition-colors">
                      {activeTrack.title}
                    </p>
                  </div>
                </button>

                {/* Top-Right Window Controls (Queue Drawer, Minimize & Close) */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowQueueDrawer((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono cursor-pointer transition-colors ${
                      showQueueDrawer
                        ? 'bg-red-700 text-white border-red-500'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                    title="Ver y reordenar cola de reproducción"
                  >
                    <ListMusic className="w-3.5 h-3.5 text-red-400" />
                    <span>Cola ({tracks.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-white cursor-pointer"
                    title="Minimizar en pestaña flotante"
                  >
                    <Minimize2 className="w-3.5 h-3.5 text-red-400" />
                    <span className="hidden sm:inline">Minimizar</span>
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
              <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400 py-0.5">
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
                <span className="w-9 text-neutral-400">
                  {displayMaxDur}
                </span>
              </div>

              {/* ROW 3 (BOTTOM): Playback Controls, Stems & Picture-in-Picture */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                {/* Left: Mute + Optional Stems */}
                <div className="flex items-center gap-1.5">
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
                    className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                    title="Anterior"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white flex items-center justify-center shadow-lg shadow-red-950/60 active:scale-95 transition-transform cursor-pointer"
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
                    className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                    title="Siguiente"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Right: Picture-in-Picture & Full Console Link */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={togglePiP}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      isPiPActive
                        ? 'bg-red-700 text-white border-red-400 shadow-lg shadow-red-950/60'
                        : 'bg-red-950/60 text-red-300 border-red-800/70 hover:bg-red-900/60 hover:text-white'
                    }`}
                    title="Modo Picture-in-Picture (sigue reproduciendo en ventana flotante aunque cambies de ventana o pestaña)"
                  >
                    <PictureInPicture2 className="w-3.5 h-3.5" />
                    <span>{isPiPActive ? 'PiP Activo' : 'PiP'}</span>
                  </button>

                  <Link
                    href={`/player?track=${encodeURIComponent(
                      activeTrack.productId || activeTrack.id
                    )}`}
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white"
                    title="Abrir consola completa del reproductor"
                  >
                    <Headphones className="w-3.5 h-3.5 text-red-400" />
                    <span className="hidden sm:inline">Consola</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </>
  )
}

