'use client'

import { useState, useMemo, useActionState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PlusCircle, MessageSquare, Tag, Video, Sparkles, X, Search, Flame, Clock, ThumbsUp, ArrowRight, ShoppingBag, Check } from 'lucide-react'
import { createForumThread, type ThreadActionState } from './actions'
import { formatPrice, type AppUser } from '@/lib/types'
import type { ThreadWithAuthor } from './page'

type CommunityClientProps = {
  threads: ThreadWithAuthor[]
  products: Array<{ id: string; name: string; slug?: string; price_cents?: number; thumbnail_url?: string }>
  currentUser: AppUser | null
}

const DEFAULT_TAGS = ['Música', 'Fotografía', 'Vídeo', 'Show en vivo', 'Ropa', 'Merch']
const initialState: ThreadActionState = {}

export function CommunityClient({ threads, products, currentUser }: CommunityClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [searchRaw, setSearchRaw] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedProductTag, setSelectedProductTag] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'rating' | 'recent'>('recent')

  // Product tagging autocomplete state
  const [productSearchInput, setProductSearchInput] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])

  const [state, formAction, pending] = useActionState(createForumThread, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      setShowForm(false)
      setSelectedProductIds([])
      setProductSearchInput('')
    }
  }, [state?.success])

  // Filtered and sorted threads
  const filteredThreads = useMemo(() => {
    return threads
      .filter((thread) => {
        if (searchRaw) {
          const q = searchRaw.toLowerCase()
          const titleMatch = thread.title.toLowerCase().includes(q)
          const bodyMatch = thread.body.toLowerCase().includes(q)
          if (!titleMatch && !bodyMatch) return false
        }

        if (selectedTag) {
          if (!thread.tags || !thread.tags.includes(selectedTag)) return false
        }

        if (selectedProductTag) {
          if (thread.products?.slug !== selectedProductTag && thread.linked_product_id !== selectedProductTag) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return (b.upvotes || 0) - (a.upvotes || 0)
        }
        // Strict chronological sort (newer posts first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [threads, searchRaw, selectedTag, selectedProductTag, sortBy])

  // Product showcase banner data if product tag filter is active
  const showcaseProduct = useMemo(() => {
    if (!selectedProductTag) return null
    return products.find((p) => p.slug === selectedProductTag || p.id === selectedProductTag) || null
  }, [products, selectedProductTag])

  // Product autocomplete list for creation
  const filteredProductOptions = useMemo(() => {
    if (!productSearchInput.trim()) return products
    const q = productSearchInput.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, productSearchInput])

  const clearAllFilters = () => {
    setSelectedTag(null)
    setSelectedProductTag(null)
    setSearchRaw('')
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Product Showcase Banner & Clear Filter CTA */}
      {(showcaseProduct || selectedTag || selectedProductTag || searchRaw) && (
        <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            {showcaseProduct?.thumbnail_url && (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0">
                <Image src={showcaseProduct.thumbnail_url} alt={showcaseProduct.name} fill className="object-cover" />
              </div>
            )}
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-red-400">Filtro Activo</span>
              <h3 className="text-sm font-bold text-white">
                {showcaseProduct ? showcaseProduct.name : selectedTag ? `#${selectedTag}` : `Búsqueda: "${searchRaw}"`}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showcaseProduct && (
              <Link
                href={`/shop/${showcaseProduct.slug || showcaseProduct.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Ver en Tienda</span>
              </Link>
            )}
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold text-red-400 bg-red-950/80 border border-red-900/60 hover:bg-red-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Eliminar Filtros</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Action Bar: Search, Rating Sort, Tag Cloud & Create Thread */}
      <div className="space-y-4 bg-neutral-900/40 border border-neutral-800/80 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Forum Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchRaw}
              onChange={(e) => setSearchRaw(e.target.value)}
              placeholder="Buscar en los hilos del foro…"
              className="w-full pl-10 pr-4 py-2 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 outline-none focus:border-red-600 font-sans"
            />
            {searchRaw && (
              <button
                onClick={() => setSearchRaw('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 hover:text-white"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Rating / Recent Sort Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setSortBy('recent')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  sortBy === 'recent' ? 'bg-red-950 text-white font-semibold border border-red-800/60' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Clock className="w-3 h-3 text-red-400" /> Recientes
              </button>
              <button
                type="button"
                onClick={() => setSortBy('rating')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  sortBy === 'rating' ? 'bg-red-950 text-white font-semibold border border-red-800/60' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Flame className="w-3 h-3 text-red-400" /> Votos
              </button>
            </div>

            {currentUser ? (
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-all shadow-md cursor-pointer whitespace-nowrap"
              >
                {showForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                <span>{showForm ? 'Cancelar' : 'Crear Hilo'}</span>
              </button>
            ) : (
              <Link
                href="/auth/login?next=/community"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-300 bg-neutral-900 border border-neutral-800 hover:text-white transition-colors whitespace-nowrap"
              >
                Publicar
              </Link>
            )}
          </div>
        </div>

        {/* Default Tag Filters Cloud */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-1">
          <span className="text-neutral-500 font-mono text-[11px]">Etiquetas:</span>
          <button
            onClick={clearAllFilters}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
              !selectedTag && !selectedProductTag ? 'bg-red-950 text-white border border-red-800 font-bold' : 'bg-neutral-950 text-neutral-400 hover:text-white'
            }`}
          >
            Todas
          </button>
          {DEFAULT_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => { setSelectedTag(selectedTag === tag ? null : tag); setSelectedProductTag(null); }}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                selectedTag === tag ? 'bg-red-950 text-white border border-red-800 font-bold' : 'bg-neutral-950 text-neutral-400 hover:text-white'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
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
              Publicar Nuevo Hilo en la Comunidad
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-neutral-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">Título del Hilo *</label>
            <input
              type="text"
              name="title"
              required
              minLength={3}
              maxLength={150}
              placeholder="Ej: Remix exclusivo de vocales acapella o fotos de pósters…"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-sans"
            />
          </div>

          {/* Typing Product Autocomplete Input & Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">
              Etiquetar Productos de la Tienda (Escribe para buscar)
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={productSearchInput}
                onChange={(e) => setProductSearchInput(e.target.value)}
                placeholder="Escribe el nombre de la canción o hoodie…"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-sans"
              />

              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-neutral-950 border border-neutral-800 rounded-xl">
                {filteredProductOptions.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id))
                        } else {
                          setSelectedProductIds([...selectedProductIds, p.id])
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-red-950 text-red-300 border border-red-800 font-bold'
                          : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-red-400" />}
                      <span>{p.name}</span>
                    </button>
                  )
                })}
              </div>
              <input type="hidden" name="linked_product_id" value={selectedProductIds[0] || ''} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">Etiquetas (separadas por comas)</label>
            <input
              type="text"
              name="tags"
              placeholder="Música, Fotografía, 2026…"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">Contenido / Mensaje *</label>
            <textarea
              name="body"
              required
              minLength={5}
              maxLength={5000}
              rows={4}
              placeholder="Describe tu publicación..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-600 resize-y font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300">Enlace a YouTube (Opcional)</label>
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
              <label className="block text-xs font-medium text-neutral-300">URL de Imagen (Opcional)</label>
              <input
                type="url"
                name="image_url"
                placeholder="https://..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
              />
            </div>
          </div>

          {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
          {state?.success && <p className="text-xs text-emerald-400">{state.success}</p>}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 active:scale-95 disabled:opacity-60 transition-all cursor-pointer shadow-md"
            >
              <span>{pending ? 'Publicando…' : 'Publicar Hilo'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Threads Feed */}
      <div className="space-y-4">
        {filteredThreads.map((thread) => {
          const authorName = thread.profiles?.display_name || thread.profiles?.username || thread.profiles?.email?.split('@')[0] || 'Miembro'
          const authorUsername = thread.profiles?.username || thread.profiles?.email?.split('@')[0] || thread.author_id
          const authorAvatar = thread.profiles?.avatar_url

          // Linked product details
          const linkedProduct = products.find(p => p.slug === thread.linked_product_id || p.id === thread.linked_product_id) || thread.products

          return (
            <article
              key={thread.id}
              className="group border border-neutral-800/80 rounded-2xl p-5 space-y-3 bg-neutral-900/40 backdrop-blur-md hover:border-red-900/60 transition-all duration-200"
            >
              {/* Header: Clickable Author Profile & Product Tag with Thumbnail */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/60 pb-2.5">
                <Link
                  href={`/u/${authorUsername}`}
                  className="flex items-center gap-2.5 group/author hover:text-red-400 transition-colors"
                >
                  <div className="relative w-7 h-7 rounded-full overflow-hidden border border-red-900/50 bg-neutral-950 shrink-0">
                    {authorAvatar ? (
                      <Image src={authorAvatar} alt={authorName} fill className="object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-bold text-red-400">
                        {authorName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-white group-hover/author:text-red-400 transition-colors">
                    @{authorName}
                  </span>
                </Link>

                <div className="flex items-center gap-2 text-xs font-mono">
                  {linkedProduct && (
                    <button
                      onClick={() => {
                        const tagVal = linkedProduct.slug || ('id' in linkedProduct ? (linkedProduct as { id?: string }).id : null)
                        if (tagVal) setSelectedProductTag(tagVal)
                      }}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-950/80 border border-red-900/60 px-2.5 py-1 rounded-full hover:bg-red-900 transition-colors cursor-pointer"
                    >
                      {Boolean(('thumbnail_url' in linkedProduct) && (linkedProduct as { thumbnail_url?: string | null }).thumbnail_url) && (
                        <div className="relative w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 border border-neutral-800">
                          <Image src={(linkedProduct as { thumbnail_url?: string }).thumbnail_url!} alt="" fill className="object-cover" />
                        </div>
                      )}
                      <Tag className="w-3 h-3" />
                      <span>{linkedProduct.name}</span>
                    </button>
                  )}

                  <time dateTime={thread.created_at} className="text-neutral-500 text-[10px]">
                    {new Date(thread.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </time>
                </div>
              </div>

              {/* Title & Preview Excerpt */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-red-400 transition-colors">
                  <Link href={`/community/${thread.id}`}>
                    {thread.title}
                  </Link>
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                  {thread.body}
                </p>
              </div>

              {/* Footer Actions: Upvote Net Count & "Leer más →" Link */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-800/60 text-xs">
                <div className="flex items-center gap-4 font-mono text-neutral-400">
                  <span className="flex items-center gap-1 text-red-400 font-bold">
                    <ThumbsUp className="w-3.5 h-3.5" /> {thread.upvotes || 0} votos
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-neutral-500" /> Discusión
                  </span>
                </div>

                <Link
                  href={`/community/${thread.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                >
                  <span>Leer más</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          )
        })}

        {filteredThreads.length === 0 && (
          <div className="p-8 text-center border border-neutral-800 rounded-2xl text-neutral-400 text-sm space-y-2">
            <p>No se encontraron hilos de la comunidad para este filtro.</p>
            <button
              onClick={clearAllFilters}
              className="text-xs font-bold text-red-400 hover:underline cursor-pointer"
            >
              Ver todos los hilos
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
