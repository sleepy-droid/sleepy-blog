'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Sparkles, Play, ArrowRight } from 'lucide-react'
import type { Post } from '@/lib/types'

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
  const coverImage = activePost.image_url || activePost.cover_url || 
    (activePost.title?.toLowerCase().includes('criss angel') ? '/images/releases/criss-angel.jpg' : '/images/logos/PNG-04.png')

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % carouselPosts.length)
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + carouselPosts.length) % carouselPosts.length)

  return (
    <section className="relative w-full rounded-3xl overflow-hidden border border-neutral-800/90 bg-neutral-950 shadow-2xl shadow-red-950/20 group">
      {/* Background Cover Image with Gradient Mask */}
      <div className="relative w-full aspect-[2/1] sm:aspect-[2.5/1] md:aspect-[3/1] max-h-[380px] overflow-hidden">
        <Image
          src={coverImage}
          alt={activePost.title}
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="object-cover group-hover:scale-105 transition-transform duration-700 transform-gpu"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/40 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-red-400 bg-red-950/90 border border-red-900/60 px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
            Lanzamiento Destacado
          </span>

          <div className="flex items-center gap-1 bg-neutral-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-neutral-800 text-[11px] font-mono text-neutral-400">
            <span>{currentIndex + 1}</span>
            <span>/</span>
            <span>{carouselPosts.length}</span>
          </div>
        </div>

        <div className="space-y-2 max-w-xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight line-clamp-2">
            {activePost.title}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 leading-relaxed font-sans">
            {activePost.content}
          </p>

          <div className="pt-2 flex items-center gap-3">
            <Link
              href={`/posts/${activePost.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-950 cursor-pointer"
            >
              <span>Ver Bitácora Completa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {activePost.media_url && (
              <a
                href={activePost.media_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-200 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 transition-colors"
              >
                <Play className="w-3 h-3 fill-current text-red-400" />
                Escuchar
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Slide Navigation Buttons */}
      {carouselPosts.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Anterior publicación"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-neutral-950/70 border border-neutral-800 text-white hover:bg-red-950 hover:border-red-800 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Siguiente publicación"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-neutral-950/70 border border-neutral-800 text-white hover:bg-red-950 hover:border-red-800 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {carouselPosts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? 'w-6 bg-red-500' : 'w-1.5 bg-neutral-600 hover:bg-neutral-400'
                }`}
                aria-label={`Ir al slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
