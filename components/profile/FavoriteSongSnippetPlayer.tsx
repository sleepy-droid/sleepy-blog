'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Play, Pause, Music } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SongPreset } from '@/lib/profile-presets'

type FavoriteSongSnippetPlayerProps = {
  song: SongPreset
  className?: string
}

export function FavoriteSongSnippetPlayer({
  song,
  className,
}: FavoriteSongSnippetPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const maxDuration = 30 // Snippet acotado a 30 segundos

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        setIsPlaying(false)
      })
    }
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    const cur = audioRef.current.currentTime

    // Si alcanza los 30 segundos, detenemos el snippet
    if (cur >= maxDuration) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
    } else {
      setCurrentTime(cur)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = val
      setCurrentTime(val)
    }
  }

  const formatSeconds = (sec: number) => {
    const s = Math.floor(sec % 60)
    const m = Math.floor(sec / 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // Cleanup al desmontar
  useEffect(() => {
    const audio = audioRef.current
    return () => {
      if (audio) {
        audio.pause()
      }
    }
  }, [])

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-red-900/60 bg-gradient-to-r from-neutral-950 via-neutral-900/90 to-red-950/30 p-3.5 shadow-xl transition-all duration-300 hover:border-red-600/60 hover:shadow-[0_0_25px_rgba(220,38,38,0.25)]',
        className
      )}
    >
      <audio
        ref={audioRef}
        src={song.audioPreviewUrl}
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
        }}
      />

      <div className="flex items-center gap-3.5">
        {/* Cover Art con Overlay de Play */}
        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-red-950/80 bg-neutral-900 shrink-0 shadow-md">
          <Image
            src={song.thumbnailUrl}
            alt={song.title}
            fill
            className={cn(
              'object-cover transition-transform duration-500',
              isPlaying && 'scale-105'
            )}
            sizes="56px"
          />

          {/* Equalizer animation overlay when playing */}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center gap-0.5 pointer-events-none">
              <span className="w-1 bg-red-400 rounded-full animate-bounce [animation-delay:0ms] h-4" />
              <span className="w-1 bg-red-500 rounded-full animate-bounce [animation-delay:150ms] h-6" />
              <span className="w-1 bg-red-400 rounded-full animate-bounce [animation-delay:300ms] h-3" />
            </div>
          )}
        </div>

        {/* Info & Controles */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
                  <Music className="w-3 h-3 text-red-400" /> Canción Favorita
                </span>
                <span className="text-[9px] font-mono text-neutral-400 bg-neutral-900/80 border border-neutral-800 px-1.5 py-0.2 rounded">
                  Snippet 30s
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold text-white truncate group-hover:text-red-300 transition-colors">
                {song.title}
              </h3>
            </div>

            {/* Botón Circular de Reproducir */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pausar snippet' : 'Reproducir snippet'}
              className="relative w-9 h-9 rounded-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white flex items-center justify-center shadow-lg shadow-red-950/60 transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
          </div>

          {/* Scrubber / Barra de Progreso acotada a 30s */}
          <div className="space-y-1">
            <div className="relative flex items-center">
              <input
                type="range"
                min={0}
                max={maxDuration}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
              <span>{formatSeconds(currentTime)}</span>
              <span>{formatSeconds(maxDuration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
