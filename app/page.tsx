import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { getUserVotesMap } from '@/lib/votes-server'
import { hydrateProductWithFolderAssets, hydratePostWithFolderAssets } from '@/lib/product-files'
import { extractPostProductIds } from '@/lib/utils'
import { PostCarousel } from '@/components/home/PostCarousel'
import { PostFeedClient } from '@/components/home/PostFeedClient'
import { Sparkles, PlusCircle, MessageSquare, ArrowRight, Disc, Clock } from 'lucide-react'
import type { Post, Product } from '@/lib/types'

export default async function Home() {
  const supabase = await createClient()
  const currentUser = await getCurrentUser()

  const [{ data: dbPosts }, { data: dbProducts }] = await Promise.all([
    supabase
      .from('posts')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('*')
      .eq('is_published', true),
  ])

  const productList = ((dbProducts ?? []) as Product[]).map((p) =>
    hydrateProductWithFolderAssets(p)
  )
  const productById = new Map<string, Product>()
  for (const p of productList) {
    productById.set(p.id, p)
    if (p.slug) productById.set(p.slug, p)
  }

  const posts: Post[] = (dbPosts ?? []).map((rawPost) => {
    const post = rawPost as Post
      const taggedIds = extractPostProductIds(post)
      const linkedProducts: Product[] = taggedIds
        .map((id) => productById.get(id))
        .filter((p): p is Product => Boolean(p))
        .slice(0, 3)

      let linked: Product | null = linkedProducts[0] || null
      if (!linked && post.title) {
        const lowerTitle = post.title.toLowerCase()
        linked =
          productList.find(
            (p) =>
              lowerTitle.includes(p.name.toLowerCase()) ||
              lowerTitle.includes(p.slug.replace(/-/g, ' '))
          ) || null
        if (linked) linkedProducts.push(linked)
      }
      return hydratePostWithFolderAssets(post, linked, linkedProducts)
    })

  // Auto-reparar filas en Supabase cuando el administrador navega y un archivo de public/songs fue renombrado
  if (currentUser?.isAdmin) {
    for (const rawP of (dbProducts ?? []) as Product[]) {
      const hydrated = productById.get(rawP.id)
      if (
        hydrated &&
        (hydrated.thumbnail_url !== rawP.thumbnail_url ||
          hydrated.audio_preview_url !== rawP.audio_preview_url ||
          hydrated.wav_url !== rawP.wav_url)
      ) {
        await supabase
          .from('products')
          .update({
            thumbnail_url: hydrated.thumbnail_url,
            audio_preview_url: hydrated.audio_preview_url,
            wav_url: hydrated.wav_url,
          })
          .eq('id', rawP.id)
      }
    }
    for (const rawPost of (dbPosts ?? []) as Post[]) {
      const hydratedPost = posts.find((p) => p.id === rawPost.id)
      if (
        hydratedPost &&
        (hydratedPost.image_url !== rawPost.image_url ||
          hydratedPost.cover_url !== rawPost.cover_url)
      ) {
        await supabase
          .from('posts')
          .update({
            image_url: hydratedPost.image_url,
            cover_url: hydratedPost.cover_url,
          })
          .eq('id', rawPost.id)
      }
    }
  }

  const userVotes = await getUserVotesMap({
    supabase,
    userId: currentUser?.id,
    targetType: 'post',
    targetIds: posts.map((p) => p.id),
  })

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
      </header>

      {/* When posts exist, display Carousel and Feed */}
      {posts.length > 0 ? (
        <>
          <PostCarousel posts={posts} />
          <PostFeedClient posts={posts} userVotes={userVotes} />
        </>
      ) : (
        /* Friendly and Atmospheric "Coming Soon" Homepage View */
        <section className="space-y-8 animate-in fade-in duration-300">
          <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-950/80 p-8 sm:p-12 text-center space-y-6 shadow-2xl shadow-red-950/20">
            {/* Ambient Red Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-red-950/90 border border-red-900/60 text-red-400 shadow-md">
                <Clock className="w-3.5 h-3.5 animate-pulse text-red-500" />
                <span>COMING SOON • PRÓXIMAMENTE</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Bitácora Oficial en Preparación
              </h2>

              <p className="text-sm text-neutral-300 leading-relaxed">
                Estamos alistando las primeras publicaciones oficiales, diarios de estudio y noticias sobre los estrenos de sleepyred999.
              </p>

              {currentUser?.isAdmin && (
                <div className="pt-2">
                  <Link
                    href="/admin/posts/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-600 transition-all cursor-pointer shadow-lg shadow-red-950/40"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Publicar la Primera Entrada Oficial</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Access Exploration Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/shop"
              className="group border border-neutral-800/80 rounded-2xl p-6 bg-neutral-900/40 hover:border-red-900/60 hover:bg-neutral-900/70 transition-all duration-300 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-900/50 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                  <Disc className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                  Catálogo & Tienda Oficial
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Explora los lanzamientos de audio máster de estudio sin compresión y artículos de merchandising.
                </p>
              </div>
              <span className="text-xs font-semibold text-red-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Ver Catálogo en la Tienda <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            <Link
              href="/community"
              className="group border border-neutral-800/80 rounded-2xl p-6 bg-neutral-900/40 hover:border-red-900/60 hover:bg-neutral-900/70 transition-all duration-300 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                  Comunidad & Foro
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Conéctate con otros oyentes, inicia debates sobre producciones y comparte tus opiniones.
                </p>
              </div>
              <span className="text-xs font-semibold text-neutral-300 group-hover:text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Ir a la Comunidad <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </section>
      )}
    </main>
  )
}
