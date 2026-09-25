'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Flame, Clock, Play, ArrowRight, Camera, MessageSquare, Share2 } from 'lucide-react'
import { sanitizeSearch } from '@/lib/search'
import { PostLikeButton } from './PostLikeButton'
import type { Post } from '@/lib/types'
import { normalizeMediaUrl, parseMediaUrls } from '@/lib/utils'

type PostFeedClientProps = {
  posts: Post[]
}

export function PostFeedClient({ posts }: PostFeedClientProps) {
  const [searchRaw, setSearchRaw] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const sanitizedQuery = useMemo(() => sanitizeSearch(searchRaw), [searchRaw])

  const categories = useMemo(() => {
    const set = new Set<string>()
    posts.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return Array.from(set)
  }, [posts])

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        if (sanitizedQuery) {
          const q = sanitizedQuery.toLowerCase()
          const titleMatch = post.title.toLowerCase().includes(q)
          const contentMatch = post.content.toLowerCase().includes(q)
          const catMatch = post.category?.toLowerCase().includes(q)
          if (!titleMatch && !contentMatch && !catMatch) return false
        }
        if (selectedCategory !== 'all' && post.category !== selectedCategory) {
          return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'popular') {
          const likesDiff = (b.like_count || 0) - (a.like_count || 0)
          if (likesDiff !== 0) return likesDiff
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [posts, sanitizedQuery, selectedCategory, sortBy])

  return (
    <div className="space-y-6">
      {/* Controls Bar: SQL Injection Safe Search + Sort Toggle + Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-neutral-900/40 p-4 rounded-2xl border border-neutral-800/80 backdrop-blur-md">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            placeholder="Buscar en la bitácora (título, contenido)…"
            className="w-full pl-10 pr-4 py-2 bg-neutral-950/80 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-950 font-sans"
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

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
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
              onClick={() => setSortBy('popular')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                sortBy === 'popular' ? 'bg-red-950 text-white font-semibold border border-red-800/60' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3 text-red-400" /> Populares
            </button>
          </div>

          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 rounded-xl px-3 py-1.5 outline-none focus:border-red-600 cursor-pointer"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Posts Feed Grid */}
      <section className="space-y-6">
        {filteredPosts.map((post) => {
          const postImages = parseMediaUrls(post.image_url || post.cover_url)
          if (postImages.length === 0 && post.title?.toLowerCase().includes('criss angel')) {
            postImages.push('/images/releases/criss-angel.jpg')
          }
          const mediaUrl = normalizeMediaUrl(post.media_url) || null

          return (
            <article 
              key={post.id} 
              className="group border border-neutral-800/80 rounded-2xl p-5 md:p-6 space-y-4 bg-neutral-900/40 backdrop-blur-md hover:border-red-900/50 transition-all duration-300 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-red-500 bg-red-950/50 px-2.5 py-1 rounded-md border border-red-900/30">
                  {post.highlight_tag || post.category || 'Lanzamiento'}
                </span>
                <span className="text-xs font-mono text-neutral-500">
                  {new Date(post.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>

              {/* Adaptable Photo Container: Full Image Display + Ambient Backdrop / Controlled Multi-Photo Recaps */}
              {postImages.length > 0 && (
                <div className="pt-1">
                  {postImages.length === 1 ? (
                    /* Portada / Foto Única: Muestra el 100% de la imagen (cuadrada, vertical o panorámica) sin recortarla */
                    <Link
                      href={`/posts/${post.id}`}
                      aria-label={`Ver publicación completa: ${post.title}`}
                      className="block relative w-full min-h-[260px] max-h-[460px] rounded-2xl overflow-hidden border border-neutral-800/80 bg-neutral-950/90 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all cursor-pointer group/img shadow-xl"
                    >
                      {/* Fondo ambiental suave con los colores auténticos del arte */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <Image
                          src={postImages[0]}
                          alt=""
                          fill
                          sizes="(max-width: 768px) 100vw, 800px"
                          className="object-cover blur-3xl opacity-30 scale-110 transform-gpu"
                        />
                        <div className="absolute inset-0 bg-neutral-950/50" />
                      </div>

                      {/* Imagen completa en primer plano SIN RECORTES (object-contain) */}
                      <div className="relative z-10 w-full h-full min-h-[260px] max-h-[460px] p-3 sm:p-4 flex items-center justify-center">
                        <Image
                          src={postImages[0]}
                          alt={post.title}
                          width={800}
                          height={800}
                          sizes="(max-width: 768px) 100vw, 800px"
                          className="w-auto h-auto max-h-[430px] max-w-full object-contain rounded-xl shadow-2xl group-hover/img:scale-[1.01] transition-transform duration-300"
                        />
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-end p-4 z-20 pointer-events-none">
                        <span className="text-xs font-semibold text-white bg-red-950/90 border border-red-800/60 px-3 py-1.5 rounded-lg backdrop-blur-md shadow-lg flex items-center gap-1.5">
                          Ver Publicación Completa <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  ) : postImages.length === 2 ? (
                    /* Recap de 2 fotos (Díptico proporcionado) */
                    <Link
                      href={`/posts/${post.id}`}
                      className="grid grid-cols-2 gap-2.5 h-60 sm:h-72 rounded-2xl overflow-hidden border border-neutral-800/80 bg-neutral-950 p-2 group/grid cursor-pointer shadow-xl"
                    >
                      {postImages.map((src, i) => (
                        <div key={i} className="relative w-full h-full rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800/50">
                          <Image
                            src={src}
                            alt={`${post.title} - Foto ${i + 1}`}
                            fill
                            sizes="(max-width: 768px) 50vw, 400px"
                            className="object-cover group-hover/grid:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ))}
                    </Link>
                  ) : (
                    /* Recap de 3+ fotos (Collage tipo revista musical controlado sin desbordar el feed) */
                    <Link
                      href={`/posts/${post.id}`}
                      className="grid grid-cols-3 gap-2.5 h-64 sm:h-80 rounded-2xl overflow-hidden border border-neutral-800/80 bg-neutral-950 p-2 group/collage cursor-pointer shadow-xl"
                    >
                      <div className="col-span-2 relative h-full rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800/50">
                        <Image
                          src={postImages[0]}
                          alt={`${post.title} - Foto 1`}
                          fill
                          sizes="(max-width: 768px) 66vw, 550px"
                          className="object-cover group-hover/collage:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="grid grid-rows-2 gap-2.5 h-full">
                        <div className="relative h-full rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800/50">
                          <Image
                            src={postImages[1]}
                            alt={`${post.title} - Foto 2`}
                            fill
                            sizes="(max-width: 768px) 33vw, 250px"
                            className="object-cover group-hover/collage:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="relative h-full rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800/50">
                          <Image
                            src={postImages[2]}
                            alt={`${post.title} - Foto 3`}
                            fill
                            sizes="(max-width: 768px) 33vw, 250px"
                            className="object-cover group-hover/collage:scale-105 transition-transform duration-500"
                          />
                          {postImages.length > 3 && (
                            <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center font-mono font-bold text-sm text-white">
                              +{postImages.length - 2}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold text-white tracking-tight group-hover:text-red-400 transition-colors">
                  <Link href={`/posts/${post.id}`}>
                    {post.title}
                  </Link>
                </h2>
                <p className="text-neutral-300 text-sm mt-2 whitespace-pre-line leading-relaxed line-clamp-3">
                  {post.content}
                </p>
              </div>

              {mediaUrl && (
                <div className="pt-1">
                  <a 
                    href={mediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-medium text-red-400 hover:text-red-300 bg-neutral-950/80 px-3.5 py-2 rounded-lg border border-neutral-800 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Escuchar / Reproducir recurso adjunto</span>
                  </a>
                </div>
              )}

              {/* Card Footer Actions: Likes & Price / Link */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-800/60 text-xs">
                <PostLikeButton postId={post.id} initialLikes={post.like_count || 0} />

                <div className="flex items-center gap-3">
                  {post.linked_product ? (
                    <Link
                      href={`/shop/${post.linked_product.slug || post.linked_product.id}`}
                      className="font-mono bg-red-950/80 text-red-300 border border-red-800/50 px-3 py-1 rounded-lg font-bold hover:bg-red-900 transition-colors flex items-center gap-1.5"
                    >
                      <span>{post.linked_product.name}:</span>
                      <span>${(post.linked_product.price_cents / 100).toFixed(2)} USD</span>
                    </Link>
                  ) : post.price && post.price > 0 ? (
                    <Link 
                      href={`/posts/${post.id}`}
                      className="font-mono bg-red-950/80 text-red-300 border border-red-800/50 px-3 py-1 rounded-lg font-bold hover:bg-red-900 transition-colors"
                    >
                      ${post.price} USD
                    </Link>
                  ) : (
                    <Link
                      href={`/posts/${post.id}`}
                      className="text-neutral-400 hover:text-white font-medium flex items-center gap-1"
                    >
                      <span>Leer completo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </article>
          )
        })}

        {filteredPosts.length === 0 && (
          <div className="p-8 text-center border border-neutral-800 rounded-xl bg-neutral-900/20 text-neutral-400 text-sm">
            No se encontraron publicaciones con esos criterios.
          </div>
        )}
      </section>
    </div>
  )
}
