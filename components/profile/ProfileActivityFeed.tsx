'use client'

import { useState, useActionState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  MessageSquare,
  Sparkles,
  Flame,
  Award,
  Send,
  Loader2,
  Play,
  Pause,
  Clock,
  Music,
} from 'lucide-react'
import { postFeedNote, type FeedActionState } from '@/app/profile/feed-actions'

export type ActivityItem = {
  id: string
  type: 'note' | 'comment' | 'purchase' | 'favorite_song_changed'
  title?: string
  body?: string
  targetTitle?: string
  targetHref?: string
  audioPreviewUrl?: string
  createdAt: string
}

export type ProfileActivityFeedProps = {
  userId: string
  username: string
  displayName: string
  avatarUrl?: string | null
  isOwner: boolean
  activities: ActivityItem[]
}

const initialFeedState: FeedActionState = {}

export function ProfileActivityFeed({
  username,
  displayName,
  avatarUrl,
  isOwner,
  activities,
}: ProfileActivityFeedProps) {
  const [state, formAction, pending] = useActionState(postFeedNote, initialFeedState)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const toggleFeedAudio = (id: string, url?: string) => {
    if (!url) return

    if (playingAudioId === id) {
      audioRef.current?.pause()
      setPlayingAudioId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.play().then(() => {
          setPlayingAudioId(id)
        }).catch(() => {
          setPlayingAudioId(null)
        })
      }
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return 'Reciente'
    }
  }

  const initial = displayName.charAt(0).toUpperCase() || 'U'

  return (
    <section className="space-y-6 pt-4">
      <audio
        ref={audioRef}
        onEnded={() => setPlayingAudioId(null)}
      />

      {/* Header del Muro de Actividad */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
        <div className="space-y-0.5">
          <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-400" />
            <span>Feed & Actividad de la Comunidad</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Contribuciones, notas públicas y desbloqueos en tiempo real.
          </p>
        </div>

        <div className="text-[11px] font-mono text-neutral-500">
          {activities.length} {activities.length === 1 ? 'registro' : 'registros'}
        </div>
      </div>

      {/* Twitter-like Note Composer (Solo visible para el dueño del perfil) */}
      {isOwner && (
        <form
          action={formAction}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-md space-y-3 shadow-lg"
        >
          <input type="hidden" name="username" value={username} />

          <div className="flex items-start gap-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-red-900/60 bg-neutral-950 shrink-0">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} fill className="object-cover" sizes="32px" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-bold text-red-300">
                  {initial}
                </span>
              )}
            </div>

            <div className="flex-1">
              <textarea
                name="body"
                rows={2}
                required
                maxLength={500}
                placeholder="¿Qué estás escuchando o pensando hoy? Escribe una nota en tu feed..."
                className="w-full bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-2.5 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-red-700/60 focus:ring-1 focus:ring-red-900/40 resize-none font-sans"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-neutral-500 font-mono">
              Visible públicamente en tu perfil
            </span>

            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 shadow-md shadow-red-950/50 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {pending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{pending ? 'Publicando…' : 'Publicar nota'}</span>
            </button>
          </div>

          {state?.error && (
            <p className="text-[11px] text-red-400 font-medium">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-[11px] text-emerald-400 font-medium">{state.success}</p>
          )}
        </form>
      )}

      {/* Lista Cronológica de Actividades */}
      {activities.length > 0 ? (
        <div className="space-y-3.5">
          {activities.map((act) => {
            // Caso 1: Compra con Gold Hue
            if (act.type === 'purchase') {
              return (
                <div
                  key={act.id}
                  className="relative overflow-hidden rounded-2xl border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-neutral-900/90 to-neutral-950 p-4 shadow-xl shadow-amber-950/20 space-y-2 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-amber-950/90 border border-amber-500/60 text-amber-300">
                        <Award className="w-4 h-4 text-amber-400" />
                      </span>
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-950/80 border border-amber-600/40 px-2 py-0.5 rounded-full inline-block">
                          Desbloqueo Dorado
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(act.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-200">
                    <span className="font-bold text-white">{displayName}</span> desbloqueó el lanzamiento{' '}
                    <span className="font-extrabold text-amber-300">&ldquo;{act.targetTitle}&rdquo;</span> en máster digital.
                  </p>
                </div>
              )
            }

            // Caso 2: Cambio de Canción Favorita con Fire Hue
            if (act.type === 'favorite_song_changed') {
              const isPlaying = playingAudioId === act.id

              return (
                <div
                  key={act.id}
                  className="relative overflow-hidden rounded-2xl border border-orange-500/60 bg-gradient-to-r from-red-950/60 via-orange-950/40 to-neutral-950 p-4 shadow-xl shadow-red-950/30 space-y-2.5 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-red-950 border border-orange-500/60 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.4)]">
                        <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                      </span>
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-300 bg-gradient-to-r from-red-950 to-orange-950 border border-orange-500/50 px-2 py-0.5 rounded-full inline-block shadow-sm">
                          Vibe Actual 🔥
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(act.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 bg-neutral-950/80 p-3 rounded-xl border border-orange-950/80">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <Music className="w-4 h-4 text-orange-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">
                          {act.targetTitle}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-mono">
                          sleepyred999 • Snippet disponible
                        </p>
                      </div>
                    </div>

                    {act.audioPreviewUrl && (
                      <button
                        type="button"
                        onClick={() => toggleFeedAudio(act.id, act.audioPreviewUrl)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-3 h-3" /> Pausar
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" /> Escuchar
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            }

            // Caso 3: Comentario en la comunidad
            if (act.type === 'comment') {
              return (
                <div
                  key={act.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-neutral-800 text-neutral-400">
                        <MessageSquare className="w-3.5 h-3.5 text-red-400" />
                      </span>
                      <span className="text-xs font-semibold text-neutral-300">
                        Comentó en{' '}
                        {act.targetHref ? (
                          <Link href={act.targetHref} className="text-white hover:text-red-300 underline underline-offset-2">
                            {act.targetTitle || 'la publicación'}
                          </Link>
                        ) : (
                          <span className="text-white font-bold">{act.targetTitle}</span>
                        )}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(act.createdAt)}
                    </span>
                  </div>

                  {act.body && (
                    <p className="text-xs text-neutral-200 pl-6 border-l-2 border-red-950/80 italic font-sans leading-relaxed">
                      &ldquo;{act.body}&rdquo;
                    </p>
                  )}
                </div>
              )
            }

            // Caso 4: Nota personal (Twitter style)
            return (
              <div
                key={act.id}
                className="rounded-2xl border border-neutral-800/90 bg-neutral-900/50 p-4 space-y-2.5 backdrop-blur-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-7 h-7 rounded-full overflow-hidden border border-red-900/50 bg-neutral-950 shrink-0">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt={displayName} fill className="object-cover" sizes="28px" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-red-300">
                          {initial}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-none">{displayName}</p>
                      <p className="text-[10px] text-neutral-500 font-mono">@{username}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(act.createdAt)}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans pl-1">
                  {act.body}
                </p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 p-6 text-center space-y-2">
          <Sparkles className="w-6 h-6 text-neutral-600 mx-auto" />
          <h3 className="text-xs font-bold text-neutral-300">Sin actividad reciente registrada</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {isOwner
              ? 'Publica una nota en tu feed o interactúa en la bitácora para empezar a registrar tu legado.'
              : 'Este usuario aún no ha registrado actividad pública en su feed.'}
          </p>
        </div>
      )}
    </section>
  )
}
