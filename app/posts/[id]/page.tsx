/**
 * Dynamic Post Page for sleepyred999 storefront & newsfeed.
 * URL Route: /posts/[id]
 * File Path: app/posts/[id]/page.tsx
 * 
 * Dependencies & Purpose:
 * 1. 'next/link': Client-side soft navigation to return to home ('/').
 * 2. 'next/navigation': 'notFound()' helper to trigger Next.js 404 boundary if post is missing in database.
 * 3. '@/utils/supabase/server': Initializes Supabase SSR client to fetch data securely on the server.
 * 4. 'lucide-react': UI icons for back button, media player, share button, and purchase badges.
 */

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { CommentList } from '@/components/comments/CommentList'
import type { CommentWithAuthor } from '@/lib/types'
import { ArrowLeft, Play, Tag, Share2, Calendar } from 'lucide-react'
import type { Metadata } from 'next'
import { normalizeMediaUrl, parseMediaUrls } from '@/lib/utils'

// Definimos el tipo de props siguiendo las convenciones de Next.js 16.
// En Next.js 16, 'params' es una Promesa: Promise<{ id: string }>.
interface PostPageProps {
  params: Promise<{ id: string }>
}

/**
 * Generación dinámica de metadatos (SEO / OpenGraph) para el post individual.
 * Permite que al compartir la URL de un post en redes o ver la pestaña del navegador,
 * el título y descripción correspondan al post específico.
 */
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
    description: post.content.slice(0, 160),
  }
}

/**
 * Server Component principal para renderizar la página especializada del post.
 */
export default async function PostPage({ params }: PostPageProps) {
  // Paso 1: Desenredar (await) el objeto 'params' según los requerimientos de Next.js 16.
  const { id } = await params

  // Paso 2: Crear el cliente de Supabase optimizado para Server Components.
  // Llama a 'utils/supabase/server.ts' que lee '.env.local' y las cookies HTTP.
  const supabase = await createClient()

  // Paso 3: Consultar la tabla 'posts' en Supabase filtrando por la ID recibida en la URL.
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  // Paso 4: Manejo de errores o registros no encontrados.
  // Si la consulta devuelve error o no existe el post, enviamos al usuario al estado 404 (not-found.tsx).
  if (error || !post) {
    notFound()
  }

  // Paso 5: Comentarios + usuario actual (en paralelo conceptual; await secuencial simple).
  const currentUser = await getCurrentUser()

  const { data: commentsData } = await supabase
    .from('comments')
    .select('*, profiles:user_id (display_name, email, avatar_url, username)')
    .or(`post_id.eq.${id},target_id.eq.${id}`)
    .order('created_at', { ascending: false })

  const comments = (commentsData ?? []) as CommentWithAuthor[]

  // Detectamos todas las imágenes de la publicación
  const postImages = parseMediaUrls(post.image_url || post.cover_url)
  if (postImages.length === 0 && post.title?.toLowerCase().includes('criss angel')) {
    postImages.push('/images/releases/criss-angel.jpg')
  }
  const mediaUrl = normalizeMediaUrl(post.media_url) || null

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
            {post.category || 'Lanzamiento'}
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
            {/* Foto Principal o Única sin recortes con fondo ambiental */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-neutral-800/80 bg-neutral-950/90 shadow-2xl shadow-red-950/20 min-h-[280px] max-h-[540px] flex items-center justify-center p-3 sm:p-5">
              {/* Fondo con desenfoque suave para ambientar los márgenes */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <Image 
                  src={postImages[0]} 
                  alt="" 
                  fill 
                  className="object-cover blur-3xl opacity-25 scale-110 transform-gpu" 
                />
                <div className="absolute inset-0 bg-neutral-950/50" />
              </div>

              {/* Imagen en primer plano: 100% visible, natural y nítida (object-contain) */}
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

            {/* Si es un recap de varias fotos, mostramos las fotos adicionales en cuadrícula nítida */}
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

        {/* Recurso Multimedia (si existe) */}
        {mediaUrl && (
          <div className="pt-4">
            <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-neutral-400 uppercase font-medium tracking-wide">Recurso Multimedia</span>
                <p className="text-sm font-semibold text-white mt-0.5">Escuchar o visualizar contenido adjunto</p>
              </div>
              <a 
                href={mediaUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 active:scale-95 px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-red-900/30"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Reproducir Recurso</span>
              </a>
            </div>
          </div>
        )}

        {/* Módulo de Venta / Edición Digital Directa (si price > 0) */}
        {post.price > 0 && (
          <div className="pt-4 border-t border-neutral-800/80">
            <div className="bg-gradient-to-r from-red-950/40 via-neutral-900/60 to-neutral-950/80 border border-red-900/40 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-red-400 text-xs font-semibold uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Edición Digital Directa</span>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Adquiere directamente este contenido exclusivo y apoya al artista.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-bold text-red-300 bg-red-950/80 px-3 py-1.5 rounded-lg border border-red-800/60 shadow-inner">
                  ${post.price} USD
                </span>
                <button 
                  type="button" 
                  className="text-xs font-bold text-white bg-red-700 hover:bg-red-600 px-4 py-2.5 rounded-lg transition-colors shadow-md shadow-red-950"
                >
                  Comprar Ahora
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pie de página del Post: Acciones secundarias */}
        <div className="pt-4 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-500">
          <span>ID de bitácora: #{post.id}</span>
          <a 
            href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(`Mira esta publicación de sleepyred999: ${post.title}`)}`}
            className="inline-flex items-center gap-1.5 hover:text-neutral-300 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir</span>
          </a>
        </div>
      </article>

      {/* Comentarios: listado + formulario (si hay sesión) */}
      <CommentList
        postId={post.id}
        comments={comments}
        currentUser={currentUser}
      />
    </main>
  )
}
