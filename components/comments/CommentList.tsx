import Link from 'next/link'
import Image from 'next/image'
import { MessageSquare, Trash2 } from 'lucide-react'
import type { CommentWithAuthor, AppUser } from '@/lib/types'
import { deleteComment } from '@/app/comments/actions'
import { CommentForm } from '@/components/comments/CommentForm'
import { CommentLikeButton } from '@/components/comments/CommentLikeButton'

type CommentListProps = {
  postId?: string
  targetType?: 'post' | 'product' | 'forum_thread' | 'profile_update'
  targetId?: string
  comments: CommentWithAuthor[]
  currentUser: AppUser | null
}

export function CommentList({
  postId,
  targetType = 'post',
  targetId,
  comments,
  currentUser,
}: CommentListProps) {
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
          Comentarios
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
            Iniciar sesión →
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

                <div className="flex items-center gap-2">
                  <CommentLikeButton
                    commentId={comment.id}
                    initialLikes={comment.upvotes || 0}
                  />

                  {canModerate && (
                    <form action={deleteComment}>
                      <input type="hidden" name="comment_id" value={comment.id} />
                      <input type="hidden" name="post_id" value={postId || effectiveTargetId} />
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
                  )}
                </div>
              </div>
              <p className="text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed pl-9">
                {comment.body}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
