/**
 * Dynamic Post Page for sleepyred999 storefront & newsfeed.
 * URL Route: /posts/[id]
 * File Path: app/posts/[id]/page.tsx
 */

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { fetchCommentsWithProfiles } from '@/lib/comments-server'
import { getUserSingleVote, getUserVotesMap } from '@/lib/votes-server'
import { CommentList } from '@/components/comments/CommentList'
import { PostLikeButton } from '@/components/home/PostLikeButton'
import { hydrateProductWithFolderAssets, hydratePostWithFolderAssets } from '@/lib/product-files'
import type { Post, Product } from '@/lib/types'
import { ArrowLeft, Tag, Share2, Calendar, ShoppingBag } from 'lucide-react'
import type { Metadata } from 'next'
import {
  parseMediaUrls,
  extractPostProductIds,
  stripPostProductsMarker,
} from '@/lib/utils'

interface PostPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('title, content')
    .eq('id', id)
    .single()

  if (!post) {
    return {
      title: 'Post no encontrado | sleepyred999',
    }
  }

  return {
    title: `${post.title} | sleepyred999`,
    description: stripPostProductsMarker(post.content).slice(0, 160),
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !post) {
    notFound()
  }

  const currentUser = await getCurrentUser()

    // Resolver hasta 3 productos vinculados a la publicación
    const { data: publishedProducts } = await supabase
      .from('products')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    const productMap = new Map<string, Product>()
    for (const rawP of (publishedProducts || []) as Product[]) {
      const hydrated = hydrateProductWithFolderAssets(rawP)
      productMap.set(hydrated.id, hydrated)
      if (hydrated.slug) productMap.set(hydrated.slug, hydrated)
    }

    const taggedIds = extractPostProductIds(post)
    const linkedProducts: Product[] = taggedIds
      .map((pid) => productMap.get(pid))
      .filter((p): p is Product => Boolean(p))
      .slice(0, 3)

    let linkedProduct: Product | null = linkedProducts[0] || null
    if (!linkedProduct && (post.price > 0 || post.title)) {
      if (publishedProducts && publishedProducts.length > 0) {
        const lowerTitle = (post.title || '').toLowerCase()
      const matched =
          (publishedProducts as Product[]).find(
            (p) =>
              lowerTitle.includes(p.name.toLowerCase()) ||
              lowerTitle.includes(p.slug.replace(/-/g, ' '))
        ) || (post.price > 0 ? (publishedProducts[0] as Product) : null)
        if (matched) {
          linkedProduct = hydrateProductWithFolderAssets(matched)
          linkedProducts.push(linkedProduct)
        }
      }
    }

    const hydratedPost = hydratePostWithFolderAssets(
      post as Post,
      linkedProduct,
      linkedProducts
    )
    post.content = hydratedPost.content
    post.image_url = hydratedPost.image_url
    post.cover_url = hydratedPost.cover_url
    post.media_url = hydratedPost.media_url

    // Cargar comentarios reales (hidratando perfiles sin depender de FK en PostgREST) y estado de like del usuario
    const [comments, userPostVote] = await Promise.all([
      fetchCommentsWithProfiles({ supabase, targetId: id }),
      getUserSingleVote({
        supabase,
        userId: currentUser?.id,
        targetType: 'post',
        targetId: id,
      }),
    ])

    const commentVoteMap = await getUserVotesMap({
      supabase,
      userId: currentUser?.id,
      targetType: 'comment',
      targetIds: comments.map((c) => c.id),
    })

    // Detectamos todas las imágenes de la publicación
    const postImages = parseMediaUrls(post.image_url || post.cover_url)
    if (postImages.length === 0 && post.title?.toLowerCase().includes('criss angel')) {
      postImages.push('/images/releases/criss-angel.jpg')
    }

    const showProductModule = Boolean(linkedProduct || (post.price && post.price > 0))
    const productTargetHref = linkedProduct
      ? `/shop/${linkedProduct.slug || linkedProduct.id}`
      : post.linked_product_id
        ? `/shop/${post.linked_product_id}`
        : '/shop'
    const displayPriceUsd = linkedProduct
      ? (linkedProduct.price_cents / 100).toFixed(2)
      : post.price
        ? Number(post.price).toFixed(2)
        : null

    return (
      <main className="max-w-3xl mx-auto p-6 space-y-8 font-sans">
        {/* Botón de navegación para regresar al feed principal */}
        <nav>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-red-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver a la bitácora</span>
          </Link>
        </nav>

        {/* Tarjeta contenedora de la publicación especializada */}
        <article className="border border-neutral-800/90 rounded-2xl p-6 md:p-8 space-y-6 bg-neutral-900/50 backdrop-blur-md shadow-2xl shadow-red-950/20 overflow-hidden">
          {/* Cabecera del Post: Categoría y Fecha */}
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
            <span className="text-xs uppercase tracking-wider font-semibold text-red-500 bg-red-950/60 px-3 py-1 rounded-md border border-red-900/40 shadow-sm">
              {post.highlight_tag || post.category || 'Lanzamiento'}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <time dateTime={post.created_at}>
                {new Date(post.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </div>
          </div>

          {/* Portada / Artwork / Galería en alta resolución sin recortar */}
          {postImages.length > 0 && (
            <div className="space-y-4">
              <div className="relative w-full rounded-2xl overflow-hidden border border-neutral-800/80 bg-neutral-950/90 shadow-2xl shadow-red-950/20 min-h-[280px] max-h-[540px] flex items-center justify-center p-3 sm:p-5">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <Image
                    src={postImages[0]}
                    alt=""
                    fill
                    className="object-cover blur-3xl opacity-25 scale-110 transform-gpu"
                  />
                  <div className="absolute inset-0 bg-neutral-950/50" />
                </div>

                <div className="relative z-10 w-full flex items-center justify-center">
                  <Image
                    src={postImages[0]}
                    alt={post.title}
                    width={1200}
                    height={1200}
                    sizes="(max-width: 768px) 100vw, 800px"
                    className="w-auto h-auto max-h-[500px] max-w-full object-contain rounded-xl shadow-2xl border border-neutral-800/70"
                    priority
                  />
                </div>
              </div>

              {postImages.length > 1 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {postImages.slice(1).map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-md group/thumb">
                      <Image
                        src={src}
                        alt={`${post.title} - Foto ${i + 2}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 250px"
                        className="object-cover group-hover/thumb:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Título Principal */}
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {post.title}
          </h1>

          {/* Contenido Completo de la entrada */}
          <div className="text-neutral-200 text-base leading-relaxed whitespace-pre-line border-l-2 border-red-900/50 pl-4 py-1">
            {post.content}
          </div>

          {/* Módulo de Venta / Hasta 3 Productos Vinculados */}
          {showProductModule && (
                    <div className="pt-4 border-t border-neutral-800/80 space-y-3">
                      {linkedProducts.length > 0 ? (
                        linkedProducts.map((lp) => (
                <div
                  key={lp.id}
                  className="bg-gradient-to-r from-red-950/40 via-neutral-900/60 to-neutral-950/80 border border-red-900/40 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-red-400 text-xs font-semibold uppercase tracking-wider">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Producto Oficial: {lp.name}</span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      {lp.description
                        ? lp.description.slice(0, 120)
                        : 'Adquiere directamente este lanzamiento exclusivo en la tienda oficial y apoya al artista.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-lg sm:text-xl font-bold text-red-300 bg-red-950/80 px-3 py-1.5 rounded-lg border border-red-800/60 shadow-inner">
                      ${(lp.price_cents / 100).toFixed(2)} USD
                    </span>
                    <Link
                      href={`/shop/${lp.slug || lp.id}`}
                      className="inline-flex items-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 active:scale-95 px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-red-950 border border-red-500/40"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Comprar Ahora</span>
                    </Link>
                  </div>
                </div>
                        ))
                      ) : (
              <div className="bg-gradient-to-r from-red-950/40 via-neutral-900/60 to-neutral-950/80 border border-red-900/40 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-red-400 text-xs font-semibold uppercase tracking-wider">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Edición Digital Directa</span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Adquiere directamente este lanzamiento exclusivo en la tienda oficial y apoya al artista.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {displayPriceUsd && (
                    <span className="font-mono text-lg sm:text-xl font-bold text-red-300 bg-red-950/80 px-3 py-1.5 rounded-lg border border-red-800/60 shadow-inner">
                      ${displayPriceUsd} USD
                    </span>
                  )}
                  <Link
                    href={productTargetHref}
                    className="inline-flex items-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 active:scale-95 px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-red-950 border border-red-500/40"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Comprar Ahora</span>
                  </Link>
                </div>
              </div>
            )}
                  </div>
        )}

                  {/* Pie de página del Post: Likes en vivo & Acciones secundarias */}
                  <div className="pt-4 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-500">
                    <div className="flex items-center gap-3">
                      <PostLikeButton
                        postId={post.id}
                        initialLikes={post.like_count || post.upvotes || 0}
                        userHasVoted={userPostVote === 1}
                      />
                      <span className="font-mono text-[11px]">ID: #{post.id.slice(0, 8)}</span>
                    </div>
                    <a
                      href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(`Mira esta publicación de sleepyred999: ${post.title}`)}`}
                      className="inline-flex items-center gap-1.5 hover:text-neutral-300 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Compartir</span>
                    </a>
                  </div>
                </article>

                {/* Comentarios: listado + formulario (con edición y eliminación del autor) */}
                <CommentList
                  postId={post.id}
                  comments={comments}
                  currentUser={currentUser}
                  commentVotes={commentVoteMap}
                />
              </main>
              )
}
