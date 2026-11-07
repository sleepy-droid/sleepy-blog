'use client'

import { useState, useMemo, useActionState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  PlusCircle,
  MessageSquare,
  Tag,
  Video,
  Sparkles,
  X,
  Search,
  Flame,
  Clock,
  ThumbsUp,
  ArrowRight,
  ShoppingBag,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  createForumThread,
  deleteOwnForumThread,
  type ThreadActionState,
} from './actions'
import { toggleVote } from '@/app/votes/actions'
import { GuestLoginModal } from '@/components/auth/GuestLoginModal'
import type { AppUser } from '@/lib/types'
import type { ThreadWithAuthor, TaggedProductSummary } from './page'

type CommunityClientProps = {
  threads: ThreadWithAuthor[]
  products: Array<{
    id: string
    name: string
    slug?: string
    price_cents?: number
    thumbnail_url?: string
  }>
  currentUser: AppUser | null
  initialUserVotes?: Record<string, 1 | -1>
}

const DEFAULT_TAGS = [
  'Música',
  'Fotografía',
  'Vídeo',
  'Show en vivo',
  'Ropa',
  'Merch',
]
const initialState: ThreadActionState = {}

export function CommunityClient({
  threads,
  products,
  currentUser,
  initialUserVotes = {},
}: CommunityClientProps) {
  const pathname = usePathname()
  const [threadItems, setThreadItems] = useState<ThreadWithAuthor[]>(threads)
  const [userVotes, setUserVotes] =
    useState<Record<string, 1 | -1 | 0>>(initialUserVotes)
  const [votingThreadId, setVotingThreadId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showGuestModal, setShowGuestModal] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [searchRaw, setSearchRaw] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedProductTag, setSelectedProductTag] = useState<string | null>(
    null
  )
  const [sortBy, setSortBy] = useState<'rating' | 'recent'>('recent')

  // Product tagging autocomplete state (max 3 products)
  const [productSearchInput, setProductSearchInput] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])

  const [state, formAction, pending] = useActionState(
    createForumThread,
    initialState
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    setThreadItems(threads)
  }, [threads])

  useEffect(() => {
    setUserVotes(initialUserVotes)
  }, [initialUserVotes])

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      setShowForm(false)
      setSelectedProductIds([])
      setProductSearchInput('')
    }
  }, [state?.success])

  const handleToggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      }
      if (prev.length >= 3) {
        return prev
      }
      return [...prev, productId]
    })
  }

  const handleQuickVote = async (threadId: string) => {
    if (votingThreadId) return
    setVotingThreadId(threadId)
    try {
      const res = await toggleVote('forum_thread', threadId, 1)
      if (res.requireAuth) {
        setShowGuestModal(true)
      } else if (res.success) {
        setUserVotes((prev) => ({
          ...prev,
          [threadId]: res.userVote ?? 0,
        }))
        setThreadItems((prev) =>
          prev.map((item) =>
            item.id === threadId
              ? {
                  ...item,
                  upvotes:
                    typeof res.newLikeCount === 'number'
                      ? res.newLikeCount
                      : item.upvotes,
                  downvotes:
                    typeof res.newDownvoteCount === 'number'
                      ? res.newDownvoteCount
                      : item.downvotes,
                }
              : item
          )
        )
      }
    } finally {
      setVotingThreadId(null)
    }
  }

  const handleDeleteThread = async (threadId: string) => {
    if (deletingId) return
    setDeletingId(threadId)
    setDeleteError(null)
    try {
      const res = await deleteOwnForumThread(threadId)
      if (!res.ok) {
        setDeleteError(res.error || 'No se pudo eliminar el hilo.')
      } else {
        setThreadItems((prev) => prev.filter((t) => t.id !== threadId))
        setConfirmDeleteId(null)
      }
    } finally {
      setDeletingId(null)
    }
  }

  // Filtered and sorted threads
  const filteredThreads = useMemo(() => {
    return threadItems
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
          const taggedList = thread.linked_products || []
          const matchesMulti = taggedList.some(
            (p) => p.slug === selectedProductTag || p.id === selectedProductTag
          )
          const matchesSingle =
            thread.products?.slug === selectedProductTag ||
            thread.linked_product_id === selectedProductTag
          if (!matchesMulti && !matchesSingle) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return (b.upvotes ?? 0) - (a.upvotes ?? 0)
        }
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      })
  }, [threadItems, searchRaw, selectedTag, selectedProductTag, sortBy])

  // Product showcase banner data if product tag filter is active
  const showcaseProduct = useMemo(() => {
    if (!selectedProductTag) return null
    return (
      products.find(
        (p) => p.slug === selectedProductTag || p.id === selectedProductTag
      ) || null
    )
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
      {deleteError && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-center justify-between">
          <span>{deleteError}</span>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            className="text-red-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Product Showcase Banner & Clear Filter CTA */}
      {(showcaseProduct || selectedTag || selectedProductTag || searchRaw) && (
        <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            {showcaseProduct?.thumbnail_url && (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shrink-0">
                <Image
                  src={showcaseProduct.thumbnail_url}
                  alt={showcaseProduct.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-red-400">
                Filtro Activo
              </span>
              <h3 className="text-sm font-bold text-white">
                {showcaseProduct
                  ? showcaseProduct.name
                  : selectedTag
                    ? '#' + selectedTag
                    : 'Búsqueda: "' + searchRaw + '"'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showcaseProduct && (
              <Link
                href={'/shop/' + (showcaseProduct.slug || showcaseProduct.id)}
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
                className={cn(
                  'px-3 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer',
                  sortBy === 'recent'
                    ? 'bg-red-950 text-white font-semibold border border-red-800/60'
                    : 'text-neutral-400 hover:text-white'
                )}
              >
                <Clock className="w-3 h-3 text-red-400" /> Recientes
              </button>
              <button
                type="button"
                onClick={() => setSortBy('rating')}
                className={cn(
                  'px-3 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer',
                  sortBy === 'rating'
                    ? 'bg-red-950 text-white font-semibold border border-red-800/60'
                    : 'text-neutral-400 hover:text-white'
                )}
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
                {showForm ? (
                  <X className="w-4 h-4" />
                ) : (
                  <PlusCircle className="w-4 h-4" />
                )}
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
          <span className="text-neutral-500 font-mono text-[11px]">
            Etiquetas:
          </span>
          <button
            onClick={clearAllFilters}
            className={cn(
              'px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer',
              !selectedTag && !selectedProductTag
                ? 'bg-red-950 text-white border border-red-800 font-bold'
                : 'bg-neutral-950 text-neutral-400 hover:text-white'
            )}
          >
            Todas
          </button>
          {DEFAULT_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSelectedTag(selectedTag === tag ? null : tag)
                setSelectedProductTag(null)
              }}
              className={cn(
                'px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer',
                selectedTag === tag
                  ? 'bg-red-950 text-white border border-red-800 font-bold'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white'
              )}
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
              placeholder="Ej: Remix exclusivo de vocales acapella o fotos de pósters…"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-sans"
            />
          </div>

          {/* Multi-Product Tagging Selector (Up to 3 Products) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-neutral-300">
                Etiquetar hasta 3 Productos de la Tienda
              </label>
              <span className="text-[11px] font-mono text-red-400 font-bold">
                {selectedProductIds.length} / 3 seleccionados
              </span>
            </div>

            <input
              type="text"
              value={productSearchInput}
              onChange={(e) => setProductSearchInput(e.target.value)}
              placeholder="Filtrar canciones o productos por nombre…"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-sans"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 bg-neutral-950 border border-neutral-800 rounded-xl">
              {filteredProductOptions.map((p) => {
                const isSelected = selectedProductIds.includes(p.id)
                const isDisabled = !isSelected && selectedProductIds.length >= 3
                return (
                  <label
                    key={p.id}
                    className={cn(
                      'product-tag-label px-3 py-1.5 rounded-xl text-xs font-mono border transition-colors',
                      isSelected
                        ? 'bg-red-950/70 text-red-200 border-red-800 font-bold'
                        : isDisabled
                          ? 'bg-neutral-900/40 text-neutral-600 border-neutral-900 cursor-not-allowed opacity-60'
                          : 'bg-neutral-900/80 text-neutral-300 hover:text-white border-neutral-800'
                    )}
                  >
                    <input
                      type="checkbox"
                      name="linked_product_ids"
                      value={p.id}
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => handleToggleProductSelection(p.id)}
                      className="checkbox-custom"
                    />
                    <span className="truncate">{p.name}</span>
                  </label>
                )
              })}
            </div>
            <input
              type="hidden"
              name="linked_product_id"
              value={selectedProductIds[0] || ''}
            />
            <input
              type="hidden"
              name="linked_product_ids_csv"
              value={selectedProductIds.join(',')}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-300">
              Etiquetas (separadas por comas)
            </label>
            <input
              type="text"
              name="tags"
              placeholder="Música, Fotografía, 2026…"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
            />
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
              placeholder="Describe tu publicación..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-red-600 resize-y font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-neutral-300">
                Enlace a YouTube (Opcional)
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
                URL / Ruta de Imagen (Opcional)
              </label>
              <input
                type="text"
                name="image_url"
                placeholder="/images/... o https://..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-neutral-600 outline-none focus:border-red-600 font-mono"
              />
            </div>
          </div>

          {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
          {state?.success && (
            <p className="text-xs text-emerald-400">{state.success}</p>
          )}

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
          const authorName =
            thread.profiles?.display_name ||
            thread.profiles?.username ||
            thread.profiles?.email?.split('@')[0] ||
            'Miembro'
          const authorUsername =
            thread.profiles?.username ||
            thread.profiles?.email?.split('@')[0] ||
            thread.author_id
          const authorAvatar = thread.profiles?.avatar_url

          const canRemove = Boolean(
            currentUser &&
              (currentUser.id === thread.author_id || currentUser.isAdmin)
          )

          // Resolve up to 3 tagged products
          const taggedProducts: TaggedProductSummary[] =
            thread.linked_products && thread.linked_products.length > 0
              ? thread.linked_products
              : thread.products
                ? [thread.products]
                : []

          const myVote = userVotes[thread.id] ?? 0
          const honestUpvotes = thread.upvotes ?? 0

          return (
            <article
              key={thread.id}
              className="group border border-neutral-800/80 rounded-2xl p-5 space-y-3 bg-neutral-900/40 backdrop-blur-md hover:border-red-900/60 transition-all duration-200"
            >
              {/* Header: Clickable Author Profile & Up to 3 Tagged Products */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/60 pb-2.5">
                <Link
                  href={'/u/' + String(authorUsername)}
                  className="flex items-center gap-2.5 group/author hover:text-red-400 transition-colors"
                >
                  <div className="relative w-7 h-7 rounded-full overflow-hidden border border-red-900/50 bg-neutral-950 shrink-0">
                    {authorAvatar ? (
                      <Image
                        src={authorAvatar}
                        alt={authorName}
                        fill
                        unoptimized={authorAvatar.endsWith('.svg')}
                        className="object-cover"
                      />
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

                <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                  {taggedProducts.map((lp) => (
                    <button
                      key={lp.id || lp.slug}
                      type="button"
                      onClick={() => {
                        const tagVal = lp.slug || lp.id
                        if (tagVal) setSelectedProductTag(tagVal)
                      }}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-red-300 bg-red-950/80 border border-red-900/60 px-2.5 py-1 rounded-full hover:bg-red-900 transition-colors cursor-pointer"
                    >
                      {lp.thumbnail_url && (
                        <div className="relative w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 border border-neutral-800">
                          <Image
                            src={lp.thumbnail_url}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <Tag className="w-3 h-3" />
                      <span>{lp.name}</span>
                    </button>
                  ))}

                  <time
                    dateTime={thread.created_at}
                    className="text-neutral-500 text-[10px] pl-1"
                  >
                    {new Date(thread.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </time>
                </div>
              </div>

              {/* Title & Preview Excerpt */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-red-400 transition-colors">
                  <Link href={'/community/' + String(thread.id)}>
                    {thread.title}
                  </Link>
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                  {thread.body}
                </p>
              </div>

              {/* Footer Actions: Honest Upvote Button, Author Delete Action & "Leer más →" Link */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-800/60 text-xs">
                <div className="flex items-center gap-3 font-mono text-neutral-400">
                  <button
                    type="button"
                    disabled={votingThreadId === thread.id}
                    onClick={() => handleQuickVote(thread.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold transition-colors cursor-pointer',
                      myVote === 1
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/70'
                        : 'bg-neutral-950/80 text-neutral-300 hover:text-red-400 border border-neutral-800'
                    )}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{honestUpvotes} votos</span>
                  </button>

                  <Link
                    href={'/community/' + String(thread.id)}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Discusión</span>
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  {canRemove && (
                    <>
                      {confirmDeleteId === thread.id ? (
                        <div className="inline-flex items-center gap-1.5 bg-red-950/90 border border-red-800 px-2.5 py-1 rounded-xl">
                          <span className="text-[11px] text-red-200 font-semibold">
                            ¿Eliminar hilo?
                          </span>
                          <button
                            type="button"
                            disabled={deletingId === thread.id}
                            onClick={() => handleDeleteThread(thread.id)}
                            className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold cursor-pointer"
                          >
                            {deletingId === thread.id ? 'Borrando…' : 'Sí'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-300 hover:text-white text-[11px] cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(thread.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold text-neutral-400 hover:text-red-400 bg-neutral-950/80 border border-neutral-800 hover:border-red-900/60 transition-colors cursor-pointer"
                          title="Eliminar esta publicación del foro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      )}
                    </>
                  )}

                  <Link
                    href={'/community/' + String(thread.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                  >
                    <span>Leer más</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
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

      <GuestLoginModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        redirectPath={pathname}
        title="¿Quieres votar en el foro?"
        message="Inicia sesión con tu cuenta para apoyar los hilos de la comunidad."
      />
    </div>
  )
}
