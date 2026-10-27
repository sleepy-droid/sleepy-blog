'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { MessageSquare, Trash2, Edit3, Check, X } from 'lucide-react'
import type { CommentWithAuthor, AppUser } from '@/lib/types'
import { deleteComment, updateCommentInline } from '@/app/comments/actions'
import { CommentForm } from '@/components/comments/CommentForm'
import { CommentLikeButton } from '@/components/comments/CommentLikeButton'
import { useLanguage } from '@/lib/i18n'

type CommentListProps = {
  postId?: string
  targetType?: 'post' | 'product' | 'forum_thread' | 'profile_update'
  targetId?: string
  comments: CommentWithAuthor[]
  currentUser: AppUser | null
  commentVotes?: Record<string, 1 | -1>
}

export function CommentList({
  postId,
  targetType = 'post',
  targetId,
  comments,
  currentUser,
  commentVotes = {},
}: CommentListProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')

  const effectiveTargetId = targetId || postId || ''
  const effectiveTargetType = targetType || (postId ? 'post' : 'product')
  const returnUrl =
    effectiveTargetType === 'product'
      ? `/shop/${effectiveTargetId}`
      : effectiveTargetType === 'forum_thread'
      ? `/community/${effectiveTargetId}`
      : `/posts/${effectiveTargetId}`

  return (
    <section className="space-y-5 border-t border-neutral-800/80 pt-8">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-red-400" />
        <h2 className="text-lg font-semibold text-white">
          {t('comments_title')}
          <span className="ml-2 text-sm font-normal text-neutral-500">
            ({comments.length})
          </span>
        </h2>
      </div>

      {currentUser ? (
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-4">
          <CommentForm postId={postId} targetType={effectiveTargetType} targetId={effectiveTargetId} />
        </div>
      ) : (
        <div className="rounded-xl border border-red-950/40 bg-red-950/10 p-4 text-center space-y-2">
          <p className="text-sm text-neutral-300">
            Inicia sesión para unirte a la conversación.
          </p>
          <Link
            href={`/auth/login?next=${encodeURIComponent(returnUrl)}`}
            className="inline-flex text-xs font-semibold text-red-400 hover:text-red-300"
          >
            {t('nav_login')} →
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {comments.length === 0 && (
          <li className="text-sm text-neutral-500 py-4 text-center">
            Aún no hay comentarios. Sé el primero en opinar.
          </li>
        )}

        {comments.map((comment) => {
          const author =
            comment.profiles?.display_name ||
            comment.profiles?.username ||
            comment.profiles?.email?.split('@')[0] ||
            'Usuario'
          const username =
            comment.profiles?.username ||
            comment.profiles?.email?.split('@')[0] ||
            comment.user_id
          const avatarUrl = comment.profiles?.avatar_url
          const canModerate =
            currentUser &&
            (currentUser.id === comment.user_id || currentUser.isAdmin)

          const isEditing = editingId === comment.id

          return (
            <li
              key={comment.id}
              className="rounded-2xl border border-neutral-800/70 bg-neutral-900/40 p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Link
                    href={`/u/${username}`}
                    className="flex items-center gap-2 group min-w-0"
                  >
                    <div className="relative w-7 h-7 rounded-full overflow-hidden border border-red-900/50 bg-neutral-950 shrink-0">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={author}
                          fill
                          unoptimized={avatarUrl.endsWith('.svg')}
                          className="object-cover"
                          sizes="28px"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-red-400">
                          {author.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-red-400 group-hover:text-red-300 truncate transition-colors">
                      @{author}
                    </span>
                  </Link>
                  <time
                    dateTime={comment.created_at}
                    className="text-[10px] text-neutral-500 font-mono shrink-0"
                  >
                    {new Date(comment.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </time>
                </div>

                <div className="flex items-center gap-1.5">
                  <CommentLikeButton
                    commentId={comment.id}
                    initialLikes={comment.upvotes || 0}
                    userHasVoted={commentVotes[comment.id] === 1}
                  />

                  {canModerate && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(isEditing ? null : comment.id)
                          setEditBody(comment.body)
                        }}
                        title="Editar comentario"
                        className="p-1.5 rounded-md text-neutral-400 hover:text-sky-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <form
                        action={async (fd) => {
                          await deleteComment(fd)
                          router.refresh()
                        }}
                      >
                        <input type="hidden" name="comment_id" value={comment.id} />
                        <input type="hidden" name="post_id" value={postId || ''} />
                        <input type="hidden" name="target_type" value={effectiveTargetType} />
                        <input type="hidden" name="target_id" value={effectiveTargetId} />
                        <button
                          type="submit"
                          title="Eliminar comentario"
                          className="p-1.5 rounded-md text-neutral-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <form
                  action={async (fd) => {
                    await updateCommentInline(fd)
                    setEditingId(null)
                    router.refresh()
                  }}
                  className="space-y-2 pl-9"
                >
                  <input type="hidden" name="comment_id" value={comment.id} />
                  <input type="hidden" name="post_id" value={postId || ''} />
                  <input type="hidden" name="target_type" value={effectiveTargetType} />
                  <input type="hidden" name="target_id" value={effectiveTargetId} />
                  <textarea
                    name="body"
                    required
                    rows={2}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 p-2.5 text-xs text-white outline-none focus:border-red-600"
                  />
                  <div className="flex items-center justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Cancelar
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-700 hover:bg-red-600 text-white font-semibold cursor-pointer"
                    >
                      <Check className="w-3 h-3" /> Guardar
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed pl-9">
                  {comment.body}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
