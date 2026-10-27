'use client'

import { useState, useActionState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react'
import {
  postFeedNote,
  updateFeedItem,
  deleteFeedItem,
  type FeedActionState,
} from '@/app/profile/feed-actions'
import { SONG_PRESETS, type SongPreset } from '@/lib/profile-presets'

export type ActivityItem = {
  id: string
  type: 'note' | 'comment' | 'purchase' | 'favorite_song_changed' | 'wall_comment'
  itemSource?: 'profile_update' | 'comment'
  authorId?: string
  authorName?: string
  authorUsername?: string
  authorAvatarUrl?: string | null
  moodSongId?: string
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
  isAdmin?: boolean
  currentUserId?: string | null
  currentUserName?: string | null
  currentUserAvatar?: string | null
  availableSongs?: SongPreset[]
  activities: ActivityItem[]
}

const initialFeedState: FeedActionState = {}

export function ProfileActivityFeed({
  userId,
  username,
  displayName,
  avatarUrl,
  isOwner,
  isAdmin = false,
  currentUserId = null,
  currentUserName = null,
  currentUserAvatar = null,
  availableSongs,
  activities,
}: ProfileActivityFeedProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(postFeedNote, initialFeedState)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [selectedMoodSong, setSelectedMoodSong] = useState<string>('none')
  const [composerBody, setComposerBody] = useState<string>('')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Estados para edición y eliminación en línea
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState<string>('')
  const [editMoodSongId, setEditMoodSongId] = useState<string>('none')
  const [actionError, setActionError] = useState<string | null>(null)
  const [isMutating, startTransition] = useTransition()

  const songsList = availableSongs && availableSongs.length > 0 ? availableSongs : SONG_PRESETS

  useEffect(() => {
    if (state?.success) {
      setComposerBody('')
      setSelectedMoodSong('none')
      router.refresh()
    }
  }, [state, router])

  const toggleFeedAudio = (id: string, url?: string) => {
    if (!url) return

    if (playingAudioId === id) {
      audioRef.current?.pause()
      setPlayingAudioId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current
          .play()
          .then(() => {
            setPlayingAudioId(id)
          })
          .catch(() => {
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
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Reciente'
    }
  }

  const canModifyItem = (act: ActivityItem) => {
    if (act.type === 'purchase') return false
    if (isAdmin) return true
    if (currentUserId && act.authorId && act.authorId === currentUserId) return true
    if (isOwner && (!act.authorId || act.authorId === userId)) return true
    return false
  }

  const canDeleteItem = (act: ActivityItem) => {
    if (act.type === 'purchase') return false
    if (canModifyItem(act)) return true
    // El dueño del perfil también puede borrar comentarios que otros dejaron en su muro
    if (isOwner && act.type === 'wall_comment') return true
    return false
  }

  const startEditing = (act: ActivityItem) => {
    setEditingId(act.id)
    setEditBody(act.body || '')
    setEditMoodSongId(act.moodSongId || 'none')
    setActionError(null)
  }

  const handleSaveEdit = (act: ActivityItem) => {
    setActionError(null)
    const fd = new FormData()
    fd.set('item_id', act.id)
    fd.set(
      'item_source',
      act.itemSource || (act.type === 'comment' || act.type === 'wall_comment' ? 'comment' : 'profile_update')
    )
    fd.set('body', editBody)
    if (act.type === 'favorite_song_changed') {
      fd.set('mood_song_id', editMoodSongId)
    }
    fd.set('username', username)

    startTransition(async () => {
      const res = await updateFeedItem(fd)
      if (res.error) {
        setActionError(res.error)
      } else {
        setEditingId(null)
        router.refresh()
      }
    })
  }

  const handleDeleteItem = (act: ActivityItem) => {
    setActionError(null)
    const fd = new FormData()
    fd.set('item_id', act.id)
    fd.set(
      'item_source',
      act.itemSource || (act.type === 'comment' || act.type === 'wall_comment' ? 'comment' : 'profile_update')
    )
    fd.set('username', username)

    startTransition(async () => {
      const res = await deleteFeedItem(fd)
      if (res.error) {
        setActionError(res.error)
      } else {
        if (editingId === act.id) setEditingId(null)
        router.refresh()
      }
    })
  }

  const initial = displayName.charAt(0).toUpperCase() || 'U'

  return (
    <section className="space-y-6 pt-4">
      <audio ref={audioRef} onEnded={() => setPlayingAudioId(null)} />

      {/* Header del Muro de Actividad */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
        <div className="space-y-0.5">
          <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-400" />
            <span>Feed, Canción Mood del Día & Muro</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Notas personales, Canción Mood del Día (independiente de la Canción Favorita fija), comentarios y desbloqueos.
          </p>
        </div>

        <div className="text-[11px] font-mono text-neutral-500">
          {activities.length} {activities.length === 1 ? 'registro' : 'registros'}
        </div>
      </div>

      {/* Composer para el propietario (Nota + Canción Mood del Día 🔥) */}
      {isOwner ? (
        <form
          action={formAction}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-md space-y-3.5 shadow-lg"
        >
          <input type="hidden" name="username" value={username} />

          <div className="flex items-start gap-3">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-red-900/60 bg-neutral-950 shrink-0">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  fill
                  unoptimized={avatarUrl.endsWith('.svg')}
                  className="object-cover"
                  sizes="36px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-bold text-red-300">
                  {initial}
                </span>
              )}
            </div>

            <div className="flex-1 space-y-2.5">
              <textarea
                name="body"
                rows={2}
                maxLength={500}
                value={composerBody}
                onChange={(e) => setComposerBody(e.target.value)}
                placeholder="¿Qué estás pensando hoy? Escribe una nota o acompaña tu Canción Mood del Día..."
                className="w-full bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-2.5 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-red-700/60 focus:ring-1 focus:ring-red-900/40 resize-none font-sans"
              />

              {/* Selector de Canción Mood del Día (independiente de la Canción Favorita de cabecera) */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl bg-neutral-950/90 border border-orange-950/60">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-300 shrink-0">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>Canción Mood del Día:</span>
                </div>
                <select
                  name="mood_song_id"
                  value={selectedMoodSong}
                  onChange={(e) => setSelectedMoodSong(e.target.value)}
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500 font-sans cursor-pointer"
                >
                  <option value="none">— Solo nota de texto (Sin canción mood hoy) —</option>
                  {songsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      🔥 {s.title} ({s.artist})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-neutral-500 font-mono">
              Puedes editar o borrar tus publicaciones en cualquier momento
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
              <span>
                {pending
                  ? 'Publicando…'
                  : selectedMoodSong !== 'none'
                  ? 'Compartir Mood del Día 🔥'
                  : 'Publicar nota'}
              </span>
            </button>
          </div>

          {state?.error && (
            <p className="text-[11px] text-red-400 font-medium">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-[11px] text-emerald-400 font-medium">{state.success}</p>
          )}
        </form>
      ) : currentUserId ? (
        /* Composer para visitante logueado en el muro de otro usuario (/u/[username]) */
        <form
          action={formAction}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-md space-y-3 shadow-lg"
        >
          <input type="hidden" name="username" value={username} />
          <input type="hidden" name="target_user_id" value={userId} />
          <input type="hidden" name="is_wall_comment" value="true" />

          <div className="flex items-start gap-3">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-red-900/60 bg-neutral-950 shrink-0">
              {currentUserAvatar ? (
                <Image
                  src={currentUserAvatar}
                  alt={currentUserName || 'Usuario'}
                  fill
                  unoptimized={currentUserAvatar.endsWith('.svg')}
                  className="object-cover"
                  sizes="32px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-bold text-red-300">
                  {(currentUserName || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1">
              <textarea
                name="body"
                rows={2}
                required
                maxLength={500}
                value={composerBody}
                onChange={(e) => setComposerBody(e.target.value)}
                placeholder={`Deja un comentario en el muro de @${username}...`}
                className="w-full bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-2.5 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-red-700/60 resize-none font-sans"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-neutral-500 font-mono">
              Visible en el muro de @{username} y moderado por la comunidad
            </span>

            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 shadow-md transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {pending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{pending ? 'Enviando…' : 'Comentar en muro'}</span>
            </button>
          </div>

          {state?.error && (
            <p className="text-[11px] text-red-400 font-medium">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-[11px] text-emerald-400 font-medium">{state.success}</p>
          )}
        </form>
      ) : null}

      {actionError && (
        <div className="p-3 rounded-xl border border-red-900/60 bg-red-950/30 text-xs text-red-300">
          {actionError}
        </div>
      )}

      {/* Lista Cronológica de Actividades */}
      {activities.length > 0 ? (
        <div className="space-y-3.5">
          {activities.map((act) => {
            const isEditing = editingId === act.id
            const editable = canModifyItem(act)
            const deletable = canDeleteItem(act)

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
                          Trofeo Desbloqueado
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(act.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-200">
                    <span className="font-bold text-white">{displayName}</span> desbloqueó{' '}
                    <span className="font-extrabold text-amber-300">&ldquo;{act.targetTitle}&rdquo;</span> en su vitrina.
                  </p>
                </div>
              )
            }

            // Caso 2: Canción Mood del Día con Fire Hue
            if (act.type === 'favorite_song_changed') {
              const isPlaying = playingAudioId === act.id

              return (
                <div
                  key={act.id}
                  className="relative overflow-hidden rounded-2xl border border-orange-500/60 bg-gradient-to-r from-red-950/60 via-orange-950/40 to-neutral-950 p-4 shadow-xl shadow-red-950/30 space-y-2.5 animate-in fade-in"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-red-950 border border-orange-500/60 text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.4)]">
                        <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                      </span>
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-300 bg-gradient-to-r from-red-950 to-orange-950 border border-orange-500/50 px-2 py-0.5 rounded-full inline-block shadow-sm">
                          Canción Mood del Día 🔥
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(act.createdAt)}
                      </span>
                      {editable && !isEditing && (
                        <button
                          type="button"
                          onClick={() => startEditing(act)}
                          title="Editar Mood del Día"
                          className="p-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-white hover:border-orange-500/50 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                      {deletable && (
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => handleDeleteItem(act)}
                          title="Eliminar Mood del Día"
                          className="p-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-800/60 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2.5 bg-neutral-950/90 p-3 rounded-xl border border-orange-800/60">
                      <select
                        value={editMoodSongId}
                        onChange={(e) => setEditMoodSongId(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500"
                      >
                        {songsList.map((s) => (
                          <option key={s.id} value={s.id}>
                            🔥 {s.title}
                          </option>
                        ))}
                      </select>
                      <textarea
                        rows={2}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        placeholder="Nota o comentario sobre tu canción mood del día..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white outline-none focus:border-orange-500 resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-neutral-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-3 h-3" /> Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => handleSaveEdit(act)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold bg-orange-600 hover:bg-orange-500 text-white cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" /> Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {act.body && (
                        <p className="text-xs sm:text-sm text-neutral-100 leading-relaxed font-sans pl-1">
                          {act.body}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-3 bg-neutral-950/80 p-3 rounded-xl border border-orange-950/80">
                        <div className="min-w-0 flex items-center gap-2.5">
                          <Music className="w-4 h-4 text-orange-400 shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-bold text-white truncate">
                              {act.targetTitle}
                            </p>
                            <p className="text-[10px] text-neutral-400 font-mono">
                              sleepyred999 • Mood compartido hoy
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
                    </>
                  )}
                </div>
              )
            }

            // Caso 3: Comentario en la comunidad o Comentario dejado en el Muro
            if (act.type === 'comment' || act.type === 'wall_comment') {
              const isWall = act.type === 'wall_comment'
              const itemAuthorName = act.authorName || displayName
              const itemAuthorUser = act.authorUsername || username

              return (
                <div
                  key={act.id}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2.5 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="p-1 rounded-md bg-neutral-800 text-neutral-400 shrink-0">
                        <MessageSquare className="w-3.5 h-3.5 text-red-400" />
                      </span>
                      {isWall ? (
                        <span className="text-xs font-semibold text-neutral-300 truncate">
                          <Link
                            href={`/u/${itemAuthorUser}`}
                            className="text-white font-bold hover:text-red-400"
                          >
                            {itemAuthorName} (@{itemAuthorUser})
                          </Link>{' '}
                          escribió en este muro
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-neutral-300 truncate">
                          Comentó en{' '}
                          {act.targetHref ? (
                            <Link
                              href={act.targetHref}
                              className="text-white hover:text-red-300 underline underline-offset-2"
                            >
                              {act.targetTitle || 'la publicación'}
                            </Link>
                          ) : (
                            <span className="text-white font-bold">{act.targetTitle}</span>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(act.createdAt)}
                      </span>
                      {editable && !isEditing && (
                        <button
                          type="button"
                          onClick={() => startEditing(act)}
                          title="Editar comentario"
                          className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                      {deletable && (
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => handleDeleteItem(act)}
                          title="Eliminar comentario"
                          className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-800/60 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        rows={2}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-red-600 resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-neutral-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-3 h-3" /> Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={isMutating}
                          onClick={() => handleSaveEdit(act)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold bg-red-700 hover:bg-red-600 text-white cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" /> Guardar cambios
                        </button>
                      </div>
                    </div>
                  ) : (
                    act.body && (
                      <p className="text-xs text-neutral-200 pl-6 border-l-2 border-red-950/80 italic font-sans leading-relaxed">
                        &ldquo;{act.body}&rdquo;
                      </p>
                    )
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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-7 h-7 rounded-full overflow-hidden border border-red-900/50 bg-neutral-950 shrink-0">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={displayName}
                          fill
                          unoptimized={avatarUrl.endsWith('.svg')}
                          className="object-cover"
                          sizes="28px"
                        />
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

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDate(act.createdAt)}
                    </span>
                    {editable && !isEditing && (
                      <button
                        type="button"
                        onClick={() => startEditing(act)}
                        title="Editar nota"
                        className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                    {deletable && (
                      <button
                        type="button"
                        disabled={isMutating}
                        onClick={() => handleDeleteItem(act)}
                        title="Eliminar nota"
                        className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-800/60 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      rows={2}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-red-600 resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-neutral-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isMutating}
                        onClick={() => handleSaveEdit(act)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold bg-red-700 hover:bg-red-600 text-white cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3 h-3" /> Guardar cambios
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans pl-1">
                    {act.body}
                  </p>
                )}
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
              ? 'Publica una nota o comparte tu Canción Mood del Día para empezar a construir tu muro.'
              : 'Este usuario aún no ha registrado actividad pública en su feed.'}
          </p>
        </div>
      )}
    </section>
  )
}
