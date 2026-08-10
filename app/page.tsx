import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { PostCarousel } from '@/components/home/PostCarousel'
import { PostFeedClient } from '@/components/home/PostFeedClient'
import { Sparkles, PlusCircle, Shield, Camera, Share2, MessageSquare, ExternalLink } from 'lucide-react'
import type { Post } from '@/lib/types'

/** Seed demo posts in case database is initializing */
const DEMO_POSTS: Post[] = [
  {
    id: 'criss-angel-post',
    title: 'Criss Angel — Lanzamiento Oficial & Arte Digital',
    content: 'Criss Angel ya está disponible en todas las plataformas y exclusivamente en nuestra tienda oficial con audio máster WAV 24-bit + libro de letras.',
    category: 'Lanzamiento',
    created_at: new Date().toISOString(),
    image_url: '/images/releases/criss-angel.jpg',
    media_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    price: 12,
    is_featured: true,
    view_count: 320,
    like_count: 45
  },
  {
    id: 'sleepyred-neon-post',
    title: 'Nueva Colección Neón & Merchandising Oficial',
    content: 'Anunciamos la llegada de los hoodies oversize neón y pósters A2. Revisa la tienda para apartar tu prenda oficial.',
    category: 'Merchandising',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    image_url: '/images/logos/SLEEPYRED JPG NEON-02.jpg',
    media_url: null,
    price: 55,
    is_featured: true,
    view_count: 210,
    like_count: 30
  }
]

export default async function Home() {
  const supabase = await createClient()
  const currentUser = await getCurrentUser()

  const { data: dbPosts } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  const posts: Post[] = (dbPosts && dbPosts.length > 0) ? dbPosts : DEMO_POSTS

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10 font-sans">
      {/* Header Banner */}
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-950/60 border border-red-900/40 text-red-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bitácora Oficial & Diario</span>
          </div>

          {currentUser?.isAdmin && (
            <Link
              href="/admin/posts/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-red-800 hover:bg-red-700 transition-colors shadow-md border border-red-700/50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Crear Publicación</span>
            </Link>
          )}
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          sleepyred999
        </h1>
        <p className="text-sm text-neutral-400 max-w-xl leading-relaxed">
          Novedades, lanzamientos directos de audio sin compresión, tienda exclusiva y comunidad.
        </p>

        {/* Social Media Link Placeholders (Instagram, X, Discord) */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <a
            href="https://instagram.com/sleepyred999"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-all"
          >
            <Camera className="w-3.5 h-3.5 text-pink-500" />
            <span>Instagram</span>
            <ExternalLink className="w-3 h-3 text-neutral-500" />
          </a>
          <a
            href="https://x.com/SLEEPYRED999"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            <span>X (Twitter)</span>
            <ExternalLink className="w-3 h-3 text-neutral-500" />
          </a>
          <a
            href="https://discord.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>Discord</span>
            <ExternalLink className="w-3 h-3 text-neutral-500" />
          </a>
        </div>
      </header>

      {/* Featured Posts Carousel */}
      <PostCarousel posts={posts} />

      {/* Interactive Post Feed with Anti SQL Injection Search */}
      <PostFeedClient posts={posts} />
    </main>
  )
}