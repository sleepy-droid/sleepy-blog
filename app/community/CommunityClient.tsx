'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PlusCircle, MessageSquare, Tag, Video, Loader2, Sparkles, X, User } from 'lucide-react'
import { createForumThread, type ThreadActionState } from './actions'
import type { AppUser } from '@/lib/types'
import type { ThreadWithAuthor } from './page'

type CommunityClientProps = {
  threads: ThreadWithAuthor[]
  products: Array<{ id: string; name: string }>
  currentUser: AppUser | null
}

const initialState: ThreadActionState = {}

export function CommunityClient({ threads, products, currentUser }: CommunityClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [state, formAction, pending] = useActionState(createForumThread, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      setShowForm(false)
    }
  }, [state?.success])

  return (
    <div className="space-y-6">
      {/* Top Action Bar: Create Thread Button */}
      <div className="flex items-center justify-between bg-neutral-900/40 border border-neutral-800/80 p-4 rounded-2xl backdrop-blur-md">
        <div>
          <h2 className="text-base font-bold text-white">Hilos de la Comunidad</h2>
          <p className="text-xs text-neutral-400">
            {threads.length} debate{threads.length === 1 ? '' : 's'} activo{threads.length === 1 ? '' : 's'}
          </p>
        </div>

        {currentUser ? (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            {showForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            <span>{showForm ? 'Cancelar' : 'Crear Hilo'}</span>
          </button>
        ) : (
          <Link
            href="/auth/login?next=/community"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-neutral-300 bg-neutral-900 border border-neutral-800 hover:text-white transition-colors"
          >
            Iniciar sesión para publicar
          </Link>
        )}
      </div>

      {/* New Thread Form Modal / Collapsible Section */}
      {showForm && (
        <form
          ref={formRef}
          action={formAction}
          className="border border-red-900/50 bg-neutral-950 p-6 rounded-2xl space-y-4 shadow-2xl animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-500" />
              Publicar Nuevo Hilo en el Foro
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-neutral-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">
              Título del Hilo *
            </label>
            <input
              type="text"
              name="title"
              required
              minLength={3}
              maxLength={150}
              placeholder="Ej: Remix exclusivo de vocales acapella o consulta sobre merch…"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">
              Etiquetar Canción o Producto Original (Opcional)
            </label>
            <select
              name="linked_product_id"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-600 cursor-pointer font-sans"
            >
              <option value="">-- Ninguno (Discusión General) --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">
              Contenido / Mensaje *
            </label>
            <textarea
              name="body"
              required
              minLength={5}
              maxLength={5000}
              rows={4}
              placeholder="Describe tu hilo, comparte tu remix o realiza tu consulta…"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-600 resize-y font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300">
                Enlace a Vídeo de YouTube (Opcional)
              </label>
              <div className="relative">
                <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                <input
                  type="url"
                  name="youtube_url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300">
                URL de Imagen Adjunta (Opcional)
              </label>
              <input
                type="url"
                name="image_url"
                placeholder="https://..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
              />
            </div>
          </div>

          {state?.error && (
            <p className="text-xs text-red-400">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-xs text-emerald-400">{state.success}</p>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 active:scale-95 disabled:opacity-60 transition-all cursor-pointer shadow-md"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
              <span>{pending ? 'Publicando…' : 'Publicar Hilo'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Threads List Feed */}
      <div className="space-y-4">
        {threads.map((thread) => {
          const authorName = thread.profiles?.display_name || thread.profiles?.username || thread.profiles?.email?.split('@')[0] || 'Miembro'
          const authorAvatar = thread.profiles?.avatar_url

          return (
            <article
              key={thread.id}
              className="border border-neutral-800/80 rounded-2xl p-5 md:p-6 space-y-4 bg-neutral-900/40 backdrop-blur-md hover:border-red-900/50 transition-all duration-200"
            >
              {/* Header: Author & Tagged Product Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden border border-red-900/50 bg-neutral-950 shrink-0">
                    {authorAvatar ? (
                      <Image src={authorAvatar} alt={authorName} fill className="object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-red-400">
                        {authorName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-white">@{authorName}</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  {thread.products && (
                    <Link
                      href={`/shop/${thread.products.slug}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/80 border border-red-900/60 px-2.5 py-0.5 rounded-full hover:bg-red-900 transition-colors"
                    >
                      <Tag className="w-3 h-3" />
                      <span>{thread.products.name}</span>
                    </Link>
                  )}
                  <time dateTime={thread.created_at} className="text-neutral-500 text-[11px]">
                    {new Date(thread.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </time>
                </div>
              </div>

              {/* Title & Body */}
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {thread.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 mt-2 whitespace-pre-line leading-relaxed">
                  {thread.body}
                </p>
              </div>

              {/* YouTube Embed Player (if provided) */}
              {thread.youtube_url && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-lg">
                  <iframe
                    src={thread.youtube_url}
                    title={thread.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              {/* Optional Cover Image */}
              {!thread.youtube_url && thread.image_url && (
                <div className="relative w-full aspect-video max-h-[300px] rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                  <Image src={thread.image_url} alt={thread.title} fill className="object-cover" sizes="700px" />
                </div>
              )}
            </article>
          )
        })}

        {threads.length === 0 && (
          <div className="p-8 text-center border border-neutral-800 rounded-2xl text-neutral-400 text-sm">
            Aún no hay hilos creados en la comunidad. ¡Sé el primero en iniciar una conversación!
          </div>
        )}
      </div>
    </div>
  )
}
