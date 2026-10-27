'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  MessageSquare,
  ShoppingBag,
  FileText,
  Users,
  UserCheck,
  ExternalLink,
} from 'lucide-react'
import {
  adminHideComment,
  adminRestoreComment,
  adminDeleteComment,
  adminUpdateComment,
} from '../actions'
import type { AdminModerationItem } from '@/lib/comments-server'

type AdminCommentListProps = {
  comments: AdminModerationItem[]
}

export function AdminCommentList({ comments }: AdminCommentListProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<
    'all' | 'posts' | 'products' | 'forum' | 'profiles'
  >('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const postComments = useMemo(
    () =>
      comments.filter(
        (c) =>
          c.item_source === 'comment' &&
          (!c.target_type || c.target_type === 'post' || Boolean(c.post_id))
      ),
    [comments]
  )
  const productComments = useMemo(
    () => comments.filter((c) => c.item_source === 'comment' && c.target_type === 'product'),
    [comments]
  )
  const forumComments = useMemo(
    () =>
      comments.filter(
        (c) => c.item_source === 'comment' && c.target_type === 'forum_thread'
      ),
    [comments]
  )
  const profileComments = useMemo(
    () =>
      comments.filter(
        (c) =>
          c.item_source === 'profile_feed' || c.target_type === 'profile_update'
      ),
    [comments]
  )

  const activeComments = useMemo(() => {
    if (activeTab === 'posts') return postComments
    if (activeTab === 'products') return productComments
    if (activeTab === 'forum') return forumComments
    if (activeTab === 'profiles') return profileComments
    return comments
  }, [
    activeTab,
    comments,
    postComments,
    productComments,
    forumComments,
    profileComments,
  ])

  return (
    <div className="space-y-6">
      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-2 bg-neutral-900/60 p-1.5 rounded-2xl border border-neutral-800 backdrop-blur-md overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-red-950 text-white border border-red-800/80 font-bold shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-red-400" />
          <span>Todos (Recientes → Antiguos) ({comments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'posts'
              ? 'bg-red-950 text-white border border-red-800/80 font-bold shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-red-400" />
          <span>Publicaciones ({postComments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-red-950 text-white border border-red-800/80 font-bold shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-red-400" />
          <span>Productos ({productComments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('forum')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'forum'
              ? 'bg-red-950 text-white border border-red-800/80 font-bold shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-red-400" />
          <span>Foro ({forumComments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profiles')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'profiles'
              ? 'bg-red-950 text-white border border-red-800/80 font-bold shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-red-400" />
          <span>Perfiles & Muros ({profileComments.length})</span>
        </button>
      </div>

      {/* Comments Moderation List */}
      <div className="space-y-3">
        {activeComments.map((c) => {
          const authorName =
            c.profiles?.display_name ||
            c.profiles?.username ||
            c.profiles?.email?.split('@')[0] ||
            'Usuario'
          const authorUsername =
            c.profiles?.username ||
            c.profiles?.email?.split('@')[0] ||
            c.user_id
          const authorAvatar = c.profiles?.avatar_url
          const isHidden = c.status === 'hidden'
          const rowKey = `${c.item_source}-${c.id}`

          return (
            <div
              key={rowKey}
              className={`border rounded-2xl p-4 sm:p-5 space-y-3 transition-all ${
                isHidden
                  ? 'bg-red-950/20 border-red-900/40 opacity-75'
                  : 'bg-neutral-950/80 border-neutral-800'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/60 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/u/${authorUsername}`}
                    className="flex items-center gap-2 group"
                  >
                    <div className="relative w-7 h-7 rounded-full overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0 flex items-center justify-center">
                      {authorAvatar ? (
                        <Image
                          src={authorAvatar}
                          alt={authorName}
                          fill
                          unoptimized={authorAvatar.endsWith('.svg')}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-red-400">
                          {authorName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">
                      @{authorName}
                    </span>
                  </Link>

                  {c.target_label && (
                    <Link
                      href={c.target_href || '/'}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white hover:border-red-800 transition-colors"
                    >
                      <span>{c.target_label}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-red-400" />
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-neutral-500">
                    {new Date(c.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isHidden && (
                    <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-900/60 font-bold">
                      Oculto por Spam
                    </span>
                  )}
                </div>
              </div>

              {editingId === rowKey ? (
                <form
                  action={async (fd) => {
                    await adminUpdateComment(fd)
                    setEditingId(null)
                    router.refresh()
                  }}
                  className="space-y-2"
                >
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="item_source" value={c.item_source} />
                  <textarea
                    name="body"
                    required
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-red-600 font-sans"
                  />
                  <div className="flex justify-end gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-neutral-400 hover:text-white cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded-lg cursor-pointer"
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-xs text-neutral-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {c.body}
                </p>
              )}

              {/* Action Buttons: Hide (Spam Soft Hide), Restore, Edit, Hard Delete */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800/60 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(rowKey)
                    setEditText(c.body)
                  }}
                  className="px-2.5 py-1 rounded-lg bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-sky-400" />
                  <span>Editar</span>
                </button>

                {isHidden ? (
                  <form
                    action={async (fd) => {
                      await adminRestoreComment(fd)
                      router.refresh()
                    }}
                  >
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="item_source" value={c.item_source} />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800 flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Restablecer</span>
                    </button>
                  </form>
                ) : (
                  <form
                    action={async (fd) => {
                      await adminHideComment(fd)
                      router.refresh()
                    }}
                  >
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="item_source" value={c.item_source} />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-400 hover:bg-amber-900 border border-amber-800 flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <EyeOff className="w-3 h-3" />
                      <span>Ocultar (Spam)</span>
                    </button>
                  </form>
                )}

                <form
                  action={async (fd) => {
                    await adminDeleteComment(fd)
                    router.refresh()
                  }}
                >
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="item_source" value={c.item_source} />
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 text-neutral-400 hover:text-red-400 hover:bg-red-950 border border-neutral-800 hover:border-red-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Eliminar</span>
                  </button>
                </form>
              </div>
            </div>
          )
        })}

        {activeComments.length === 0 && (
          <div className="p-8 text-center border border-neutral-800 rounded-2xl text-neutral-500 text-xs font-mono">
            No hay comentarios ni registros de feed en esta categoría.
          </div>
        )}
      </div>
    </div>
  )
}
