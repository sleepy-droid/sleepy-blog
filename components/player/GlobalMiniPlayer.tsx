'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
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
function DocumentPiPPortalContent() {
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

  const maxDur = duration || 30

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

      {/* Artwork + Track Metadata */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginTop: '6px',
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
        <div style={{ minWidth: 0, flex: 1 }}>
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
            {activeTrack.isUnlocked ? '• MÁSTER' : '• PREVIEW 30S'}
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
          <span>{formatTime(maxDur)}</span>
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

        <span
          style={{
            fontSize: '9px',
            fontFamily: 'monospace',
            color: '#737373',
          }}
        >
          999 DECK
        </span>
      </div>
    </div>
  )
}

export function GlobalMiniPlayer() {
  const pathname = usePathname()
  const {
    activeTrack,
    stemMode,
    isPlaying,
    currentTime,
    duration,
    isMuted,
    isMinimized,
    isPiPActive,
    pipContainer,
    togglePlay,
    seek,
    stepTrack,
    toggleMute,
    selectAndPlayTrack,
    setIsMinimized,
    togglePiP,
    closePlayer,
  } = useGlobalPlayer()

  if (!activeTrack) return null

  const isOnDedicatedPlayerPage = pathname === '/player'
  const maxDur = duration || 30
  const progressPct = Math.min(100, Math.max(0, (currentTime / maxDur) * 100))

  return (
    <>
      {/* Render Portal inside OS Document Picture-in-Picture window if active */}
      {pipContainer &&
        createPortal(<DocumentPiPPortalContent />, pipContainer)}

      {/* Minimized Floating Tab Mode (Bottom-Right Corner Widget) */}
      {isMinimized ? (
        <div className="fixed bottom-4 right-4 z-50 w-[310px] sm:w-[340px] rounded-2xl border border-red-800/70 bg-neutral-950/95 backdrop-blur-xl shadow-2xl shadow-red-950/50 overflow-hidden transition-all">
          {/* Thin live progress bar at top of minimized tab */}
          <div className="w-full h-1 bg-neutral-900">
            <div
              className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="p-3 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-red-900/60 bg-neutral-900 shrink-0">
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
                <p className="text-xs font-extrabold text-white truncate">
                  {activeTrack.title}
                </p>
              </div>
            </div>

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
          <div className="fixed bottom-0 inset-x-0 z-50 border-t border-red-900/60 bg-neutral-950/95 backdrop-blur-xl shadow-[0_-10px_35px_rgba(0,0,0,0.85)]">
            <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col gap-2">
              {/* Scrubber Timeline */}
              <div className="flex items-center gap-2.5 text-[10px] font-mono text-neutral-400">
                <span className="w-8 text-right">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={maxDur}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => seek(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
                <span className="w-8">{formatTime(maxDur)}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                {/* Left: Cover & Track Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 shrink-0 shadow-md">
                    <Image
                      src={activeTrack.thumbnailUrl}
                      alt={activeTrack.title}
                      fill
                      unoptimized={activeTrack.thumbnailUrl.endsWith('.svg')}
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold">
                        {activeTrack.artist}
                      </span>
                      {activeTrack.isUnlocked ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-800/60">
                          <Unlock className="w-2.5 h-2.5" /> Máster
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-950/90 text-amber-300 border border-amber-800/60">
                          <Lock className="w-2.5 h-2.5" /> 30s
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-extrabold text-white truncate">
                      {activeTrack.title}
                    </p>
                  </div>
                </div>

                {/* Center: Transport & Stems */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => stepTrack(-1)}
                    className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                    title="Anterior"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white flex items-center justify-center shadow-lg shadow-red-950/60 cursor-pointer"
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
                    className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                    title="Siguiente"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>

                  {/* Quick Stem Switcher on Desktop */}
                  {activeTrack.isUnlocked && (
                    <div className="hidden md:flex items-center gap-1 pl-2 border-l border-neutral-800">
                      <button
                        type="button"
                        onClick={() => selectAndPlayTrack(activeTrack, 'master')}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border cursor-pointer ${
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
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold border cursor-pointer ${
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
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold border cursor-pointer ${
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

                {/* Right: PiP, Minimize, Console Link, Close */}
                <div className="flex items-center justify-end gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="hidden sm:inline-flex p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                    title={isMuted ? 'Activar sonido' : 'Silenciar'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-3.5 h-3.5 text-red-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={togglePiP}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      isPiPActive
                        ? 'bg-red-700 text-white border-red-400 shadow-lg shadow-red-950/60'
                        : 'bg-red-950/60 text-red-300 border-red-800/70 hover:bg-red-900/60 hover:text-white'
                    }`}
                    title="Modo Picture-in-Picture (sigue reproduciendo en ventana flotante aunque cambies de ventana o pestaña)"
                  >
                    <PictureInPicture2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {isPiPActive ? 'PiP Activo' : 'Modo PiP'}
                    </span>
                  </button>

                  <Link
                    href={`/player?track=${encodeURIComponent(
                      activeTrack.productId || activeTrack.id
                    )}`}
                    className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white"
                    title="Abrir consola completa del reproductor"
                  >
                    <Headphones className="w-3.5 h-3.5 text-red-400" />
                    <span>Consola</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                    title="Minimizar en pestaña flotante"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={closePlayer}
                    className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 cursor-pointer"
                    title="Cerrar reproductor"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </>
  )
}

