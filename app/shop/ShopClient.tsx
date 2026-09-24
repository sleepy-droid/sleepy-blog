'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Music, Package, Sparkles, SlidersHorizontal, ArrowUpRight } from 'lucide-react'
import { sanitizeSearch } from '@/lib/search'
import { formatPrice, type Product } from '@/lib/types'

type ShopClientProps = {
  initialProducts: Product[]
  initialQuery?: string
}

export function ShopClient({ initialProducts, initialQuery = '' }: ShopClientProps) {
  const [searchRaw, setSearchRaw] = useState(initialQuery)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'music' | 'physical'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'price_low' | 'price_high'>('recent')

  // SQL Injection proof sanitized search term
  const sanitizedQuery = useMemo(() => sanitizeSearch(searchRaw), [searchRaw])

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((product) => {
        if (sanitizedQuery) {
          const q = sanitizedQuery.toLowerCase()
          const nameMatch = product.name.toLowerCase().includes(q)
          const descMatch = product.description.toLowerCase().includes(q)
          const catMatch = product.category.toLowerCase().includes(q)
          if (!nameMatch && !descMatch && !catMatch) return false
        }

        if (activeTab === 'music') {
          return product.category === 'music' || product.fulfillment === 'digital'
        }
        if (activeTab === 'physical') {
          return product.fulfillment === 'physical'
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'popular') {
          return (b.popularity_score || 0) - (a.popularity_score || 0)
        }
        if (sortBy === 'price_low') {
          return a.price_cents - b.price_cents
        }
        if (sortBy === 'price_high') {
          return b.price_cents - a.price_cents
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [initialProducts, sanitizedQuery, activeTab, sortBy])

  const musicProducts = useMemo(
    () => filteredProducts.filter((p) => p.category === 'music' || p.fulfillment === 'digital'),
    [filteredProducts]
  )
  const physicalProducts = useMemo(
    () => filteredProducts.filter((p) => p.fulfillment === 'physical'),
    [filteredProducts]
  )

  return (
    <div className="space-y-6">
      {/* Controls Bar: Discrete Search Button + Classification Tabs + Sort Dropdown */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-neutral-900/40 backdrop-blur-md p-3.5 rounded-2xl border border-neutral-800/80">
        
        {/* Classification Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-neutral-950/90 p-1.5 rounded-xl border border-neutral-800 text-xs font-medium overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-red-950 text-white border border-red-800/60 font-semibold shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            Todos ({filteredProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('music')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'music'
                ? 'bg-red-950 text-white border border-red-800/60 font-semibold shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-red-400" />
            Música ({musicProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('physical')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'physical'
                ? 'bg-red-950 text-white border border-red-800/60 font-semibold shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-red-400" />
            Merch ({physicalProducts.length})
          </button>
        </div>

        {/* Right Section: Discrete Expandable Search & Sort */}
        <div className="flex items-center gap-2">
          {searchExpanded ? (
            <div className="relative flex-1 min-w-[200px] sm:min-w-[260px] animate-in fade-in duration-200">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                autoFocus
                value={searchRaw}
                onChange={(e) => setSearchRaw(e.target.value)}
                placeholder="Buscar canción, hoodie…"
                className="w-full pl-9 pr-7 py-1.5 bg-neutral-950 border border-red-900/60 rounded-xl text-xs text-white placeholder:text-neutral-500 outline-none focus:ring-1 focus:ring-red-600 font-sans"
              />
              <button
                onClick={() => { setSearchRaw(''); setSearchExpanded(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchExpanded(true)}
              className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Buscar</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500 hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-neutral-950 border border-neutral-800 text-xs font-medium text-neutral-300 rounded-xl px-2.5 py-1.5 outline-none focus:border-red-600 cursor-pointer"
            >
              <option value="recent">Recientes</option>
              <option value="popular">Populares</option>
              <option value="price_low">Precio ↑</option>
              <option value="price_high">Precio ↓</option>
            </select>
          </div>
        </div>
      </div>

      {/* UNIFIED CATALOG GRID (Allows sorting $55 Hoodie above $12 Music) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
          <div className="flex items-center gap-2">
            {activeTab === 'music' ? (
              <Music className="w-4 h-4 text-red-400" />
            ) : activeTab === 'physical' ? (
              <Package className="w-4 h-4 text-red-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-red-400" />
            )}
            <h2 className="text-lg font-bold text-white tracking-tight">
              {activeTab === 'music' ? 'Lanzamientos Musicales Directos' : activeTab === 'physical' ? 'Merchandising & Ediciones Físicas' : 'Todos los Productos & Lanzamientos'}
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-400">({filteredProducts.length} productos)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="p-12 text-center border border-neutral-800/80 rounded-2xl bg-neutral-900/20 space-y-4">
          <Package className="w-12 h-12 text-neutral-600 mx-auto" />
          <div className="space-y-1">
            <p className="text-base font-bold text-white">
              {initialProducts.length === 0
                ? 'Catálogo en Preparación'
                : 'No se encontraron productos'}
            </p>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              {initialProducts.length === 0
                ? 'Aún no se han publicado productos en la base de datos. Como administrador, puedes ingresar nuevos lanzamientos o artículos de merch.'
                : 'No hay productos que coincidan con los filtros o término de búsqueda ingresado.'}
            </p>
          </div>
          {initialProducts.length === 0 ? (
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-all cursor-pointer shadow-lg shadow-red-950/40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Publicar Nuevo Producto en Panel Admin</span>
            </Link>
          ) : (
            <button
              onClick={() => { setSearchRaw(''); setActiveTab('all'); }}
              className="text-xs font-semibold text-red-400 hover:text-red-300 underline cursor-pointer"
            >
              Restablecer todos los filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** Product Card with 4:3 Vertical Aspect Ratio Container & Heart Likes beside price */
function ProductCard({ product }: { product: Product }) {
  const targetHref = `/shop/${product.slug || product.id}`

  return (
    <article className="group border border-neutral-800/90 rounded-2xl p-4 bg-neutral-900/40 backdrop-blur-md hover:border-red-900/60 hover:shadow-xl hover:shadow-red-950/20 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      <div className="space-y-3">
        {/* 4:3 Vertical Aspect Ratio Image Thumbnail Container */}
        <Link 
          href={targetHref}
          aria-label={`Ver producto ${product.name}`}
          className="block relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/80 group-hover:border-red-900/40 transition-colors"
        >
          {product.thumbnail_url ? (
            <Image
              src={product.thumbnail_url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 380px"
              className="object-cover group-hover:scale-105 transition-transform duration-500 transform-gpu"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
              Sin portada
            </div>
          )}

          {/* Top Badge: Category / Fulfillment */}
          <div className="absolute top-3 left-3">
            <span className="text-[10px] uppercase font-mono font-bold text-red-300 bg-red-950/90 border border-red-900/60 px-2.5 py-1 rounded-md backdrop-blur-md">
              {product.category === 'music' ? 'Música' : product.category}
            </span>
          </div>

          {/* Hover CTA Overlay */}
          <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3 backdrop-blur-[2px]">
            <span className="text-xs font-bold text-white bg-red-950/90 border border-red-800/60 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1">
              Ver detalle del producto <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        <div>
          <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wide">
            {product.fulfillment === 'digital' ? 'Digital master' : 'Edición física'}
          </span>
          <h3 className="text-base font-bold text-white tracking-tight group-hover:text-red-400 transition-colors mt-0.5 line-clamp-1">
            <Link href={targetHref}>
              {product.name}
            </Link>
          </h3>
          <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-neutral-800/60 flex items-center justify-between mt-4">
        {/* Price & Heart Likes Count side by side */}
        <div className="flex items-center gap-2">
          <span className="text-base font-mono font-bold text-red-400">
            {formatPrice(product.price_cents, product.currency)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded-full border border-neutral-800">
            <span className="text-red-500">❤️</span>
            <span>{product.upvotes || 0}</span>
          </span>
        </div>

        <Link
          href={targetHref}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-neutral-800 group-hover:bg-red-700 rounded-lg transition-all cursor-pointer flex items-center gap-1"
        >
          <span>Explorar</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </article>
  )
}
