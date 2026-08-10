/**
 * Admin Comment Moderation Page: /admin/comments
 * File Path: app/admin/comments/page.tsx
 * 
 * Features:
 * 1. Admin content management without touching code.
 * 2. Moderation options: HIDE (soft hide status='hidden' for spam) AND DELETE (hard delete).
 * 3. Restore hidden comments option (`status='visible'`).
 */

import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { adminHideComment, adminRestoreComment, adminDeleteComment } from '@/app/admin/actions'
import { MessageSquare, EyeOff, Trash2, Eye, ShieldCheck } from 'lucide-react'
import type { Comment } from '@/lib/types'

export default async function AdminCommentsPage() {
  await requireAdmin()
  const supabase = await createClient()

  // Fetch all comments (including hidden ones)
  const { data: commentsData } = await supabase
    .from('comments')
    .select('*, profiles:user_id (display_name, email, username)')
    .order('created_at', { ascending: false })

  const comments = commentsData || []

  return (
    <div className="space-y-6 font-sans">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-red-500" />
            Moderación de Comentarios & Spam
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Administra los comentarios de posts y productos. Puedes Ocultar (spam) o Eliminar permanentemente.
          </p>
        </div>

        <span className="text-xs font-mono bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full text-neutral-300">
          Total: {comments.length}
        </span>
      </header>

      <div className="space-y-3">
        {comments.map((c) => {
          const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
          const author = (profile as { display_name?: string; email?: string } | null)?.display_name || 
            (profile as { email?: string } | null)?.email?.split('@')[0] || 'Usuario'
          
          const isHidden = c.status === 'hidden'

          return (
            <div
              key={c.id}
              className={`rounded-2xl border p-4 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                isHidden
                  ? 'border-amber-950/80 bg-amber-950/10 opacity-75'
                  : 'border-neutral-800/80 bg-neutral-900/40'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-400">@{author}</span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {new Date(c.created_at).toLocaleString('es-ES')}
                  </span>
                  {c.target_type && (
                    <span className="text-[10px] uppercase font-bold text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      {c.target_type}
                    </span>
                  )}
                  {isHidden && (
                    <span className="text-[10px] font-bold uppercase text-amber-400 bg-amber-950 border border-amber-900/80 px-2 py-0.5 rounded">
                      Oculto (Spam)
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed">
                  {c.body}
                </p>
              </div>

              {/* Action Buttons: HIDE vs RESTORE vs DELETE */}
              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-800/60 w-full md:w-auto justify-end">
                {isHidden ? (
                  <form action={adminRestoreComment}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="post_id" value={c.post_id || c.target_id || ''} />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-900/80 hover:bg-emerald-900 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Mostrar</span>
                    </button>
                  </form>
                ) : (
                  <form action={adminHideComment}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="post_id" value={c.post_id || c.target_id || ''} />
                    <button
                      type="submit"
                      title="Ocultar por spam"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-400 bg-amber-950/60 border border-amber-900/80 hover:bg-amber-900 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Ocultar (Spam)</span>
                    </button>
                  </form>
                )}

                <form action={adminDeleteComment}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="post_id" value={c.post_id || c.target_id || ''} />
                  <button
                    type="submit"
                    title="Eliminar permanentemente"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-950/60 border border-red-900/80 hover:bg-red-900 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </form>
              </div>
            </div>
          )
        })}

        {comments.length === 0 && (
          <div className="p-8 text-center border border-neutral-800 rounded-2xl text-neutral-400 text-sm">
            No hay comentarios para moderar.
          </div>
        )}
      </div>
    </div>
  )
}
