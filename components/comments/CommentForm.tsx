'use client'

import { useActionState, useEffect, useRef } from 'react'
import { MessageSquarePlus, Loader2 } from 'lucide-react'
import { createComment, type CommentActionState } from '@/app/comments/actions'

const initialState: CommentActionState = {}

type CommentFormProps = {
  postId: string
}

export function CommentForm({ postId }: CommentFormProps) {
  const [state, formAction, pending] = useActionState(createComment, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
    }
  }, [state?.success])

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="post_id" value={postId} />
      <label htmlFor="body" className="block text-xs font-medium text-neutral-300">
        Escribe un comentario
      </label>
      <textarea
        id="body"
        name="body"
        required
        minLength={1}
        maxLength={2000}
        rows={3}
        placeholder="Comparte tu opinión sobre este lanzamiento…"
        className="w-full rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-700/60 focus:ring-2 focus:ring-red-900/40 resize-y"
      />

      {state?.error && (
        <p role="alert" className="text-xs text-red-400">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-xs text-emerald-400">{state.success}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg bg-red-700 hover:bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-60 cursor-pointer"
      >
        {pending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <MessageSquarePlus className="w-3.5 h-3.5" />
        )}
        {pending ? 'Publicando…' : 'Publicar comentario'}
      </button>
    </form>
  )
}
