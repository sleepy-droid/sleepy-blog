'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Sparkles, Play, ArrowRight, ShoppingBag } from 'lucide-react'
import type { Post } from '@/lib/types'
import { normalizeMediaUrl } from '@/lib/utils'

type PostCarouselProps = {
  posts: Post[]
}

export function PostCarousel({ posts }: PostCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Filter posts that have image or media
  const carouselPosts = posts.slice(0, 5)

  useEffect(() => {
    if (carouselPosts.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselPosts.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [carouselPosts.length])

  if (carouselPosts.length === 0) return null

  const activePost = carouselPosts[currentIndex]
  const rawCover = activePost.image_url || activePost.cover_url || 
    (activePost.title?.toLowerCase().includes('criss angel') ? '/images/releases/criss-angel.jpg' : '/images/logos/PNG-04.png')
  const coverImage = normalizeMediaUrl(rawCover) || '/images/logos/PNG-04.png'
  const mediaUrl = normalizeMediaUrl(activePost.media_url)

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % carouselPosts.length)
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + carouselPosts.length) % carouselPosts.length)

  const postUrl = `/posts/${activePost.id}`

  return (
    <section className="relative w-full rounded-3xl overflow-hidden border border-neutral-800/90 bg-neutral-950 shadow-2xl shadow-red-950/20 group min-h-[340px] sm:min-h-[390px] flex flex-col justify-between">
      {/* Background Banner: Imagen en grande con presencia y volumen */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Image
          src={coverImage}
          alt={activePost.title}
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-1000 transform-gpu opacity-50 sm:opacity-55"
        />
        {/* Capa de contraste cinematográfica: sólido a la izquierda para máxima legibilidad del texto y abierto a la derecha */}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 sm:via-neutral-950/70 to-neutral-950/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/60" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-between h-full space-y-6 flex-1">
        {/* Top Bar: Highlight badge & Slide Controls */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs uppercase tracking-wider font-semibold text-red-400 bg-red-950/90 border border-red-900/60 px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-md truncate max-w-[220px]">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{activePost.highlight_tag || activePost.category || 'Lanzamiento Destacado'}</span>
          </span>

          {/* Top Controls: Prev / Next Buttons + Slide Counter */}
          <div className="flex items-center gap-2 bg-neutral-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-neutral-800 text-[11px] font-mono text-neutral-300 shadow-md shrink-0">
            {carouselPosts.length > 1 && (
              <button
                onClick={prevSlide}
                aria-label="Anterior publicación"
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}

            <span>{currentIndex + 1} / {carouselPosts.length}</span>

            {carouselPosts.length > 1 && (
              <button
                onClick={nextSlide}
                aria-label="Siguiente publicación"
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Middle Showcase: Post Info on Left + Full Uncropped Artwork on Right */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 my-auto">
          <div className="space-y-3 max-w-xl">
            <Link href={postUrl} className="block group/title">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white group-hover/title:text-red-400 transition-colors tracking-tight leading-tight line-clamp-2">
                {activePost.title}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 leading-relaxed font-sans mt-1">
                {activePost.content}
              </p>
            </Link>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href={postUrl}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-950 cursor-pointer"
              >
                <span>Ver Bitácora Completa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              {activePost.linked_product && (
                <Link
                  href={`/shop/${activePost.linked_product.slug || activePost.linked_product.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-red-950/90 hover:bg-red-900 border border-red-800/60 transition-colors shadow-md"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-red-400" />
                  <span>Tienda: ${(activePost.linked_product.price_cents / 100).toFixed(2)} USD</span>
                </Link>
              )}

              {mediaUrl && (
                <a
                  href={mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-200 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current text-red-400" />
                  <span>Escuchar</span>
                </a>
              )}
            </div>
          </div>

          {/* Uncropped Cover Artwork Thumbnail (Desktop & Tablet) */}
          <Link
            href={postUrl}
            aria-label={`Ver arte oficial de ${activePost.title}`}
            className="hidden sm:block shrink-0 relative w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden border-2 border-neutral-700/80 bg-neutral-950/90 shadow-2xl shadow-black/90 hover:border-red-500 hover:scale-105 transition-all duration-300 group/art backdrop-blur-md"
          >
            <Image
              src={coverImage}
              alt={activePost.title}
              fill
              sizes="220px"
              className="object-contain p-1.5"
            />
          </Link>
        </div>
      </div>

      {/* Dots Indicator */}
      {carouselPosts.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {carouselPosts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex === idx ? 'w-6 bg-red-500' : 'w-1.5 bg-neutral-600 hover:bg-neutral-400'
              }`}
              aria-label={`Ir al slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
