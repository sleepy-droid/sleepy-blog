import Link from 'next/link'
import { MessageSquare, Trash2 } from 'lucide-react'
import type { CommentWithAuthor, AppUser } from '@/lib/types'
import { deleteComment } from '@/app/comments/actions'
import { CommentForm } from '@/components/comments/CommentForm'

type CommentListProps = {
  postId: string
  comments: CommentWithAuthor[]
  currentUser: AppUser | null
}

export function CommentList({ postId, comments, currentUser }: CommentListProps) {
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
          <CommentForm postId={postId} />
        </div>
      ) : (
        <div className="rounded-xl border border-red-950/40 bg-red-950/10 p-4 text-center space-y-2">
          <p className="text-sm text-neutral-300">
            Inicia sesión para unirte a la conversación.
          </p>
          <Link
            href={`/auth/login?next=${encodeURIComponent(`/posts/${postId}`)}`}
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
            comment.profiles?.email?.split('@')[0] ||
            'Usuario'
          const canModerate =
            currentUser &&
            (currentUser.id === comment.user_id || currentUser.isAdmin)

          return (
            <li
              key={comment.id}
              className="rounded-xl border border-neutral-800/70 bg-neutral-900/40 p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-red-400 truncate">
                    @{author}
                  </span>
                  <time
                    dateTime={comment.created_at}
                    className="text-[10px] text-neutral-500 shrink-0"
                  >
                    {new Date(comment.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </time>
                </div>

                {canModerate && (
                  <form action={deleteComment}>
                    <input type="hidden" name="comment_id" value={comment.id} />
                    <input type="hidden" name="post_id" value={postId} />
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
              <p className="text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed">
                {comment.body}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
