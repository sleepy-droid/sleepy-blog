// Paso 1: Importamos 'Link' e 'Image' de Next.js para optimización de navegación e imágenes.
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <div className="p-4 bg-red-950/40 border border-red-800 text-red-400 rounded-lg text-sm">
          Error al cargar bitácora: {error.message}
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8 font-sans">
      <header className="border-b border-neutral-800 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-white">sleepyred999</h1>
        <p className="text-sm text-neutral-400 mt-1">Bitácora oficial, diario & lanzamientos directos</p>
      </header>

      <section className="space-y-6">
        {posts?.map((post) => {
          // Detectamos si el post incluye campo 'image_url' o 'cover_url' en Supabase,
          // o usamos la imagen local de 'criss-angel' guardada en public/images/releases/criss-angel.jpg
          const coverImage = post.image_url || post.cover_url || 
            (post.title?.toLowerCase().includes('criss angel') ? '/images/releases/criss-angel.jpg' : null)

          return (
            <article 
              key={post.id} 
              className="border border-neutral-800/80 rounded-xl p-5 space-y-4 bg-neutral-900/40 backdrop-blur-md hover:border-red-900/40 transition-colors overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-red-500 bg-red-950/50 px-2.5 py-1 rounded-md border border-red-900/30">
                  {post.category}
                </span>
                <span className="text-xs text-neutral-500">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Imagen de portada de la publicación / lanzamiento */}
              {coverImage && (
                <div className="relative w-full aspect-video sm:aspect-[2/1] rounded-lg overflow-hidden border border-neutral-800/80 bg-neutral-950">
                  <Image 
                    src={coverImage} 
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 700px"
                    className="object-cover hover:scale-105 transition-transform duration-500"
                    priority={post.title?.toLowerCase().includes('criss angel')}
                  />
                </div>
              )}

              <div>
                {/* 
                  Enlazamos el título del post hacia su página especializada '/posts/[id]'.
                  Next.js enrutará automáticamente esta URL hacia 'app/posts/[id]/page.tsx'.
                */}
                <h2 className="text-xl font-semibold text-white tracking-tight hover:text-red-400 transition-colors">
                  <Link href={`/posts/${post.id}`}>
                    {post.title}
                  </Link>
                </h2>
                <p className="text-neutral-300 text-sm mt-2 whitespace-pre-line leading-relaxed">
                  {post.content}
                </p>
              </div>

              {/* Enlace o Reproductor Multimedia */}
              {post.media_url && (
                <div className="pt-2">
                  <a 
                    href={post.media_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-medium text-red-400 hover:text-red-300 bg-neutral-800/60 px-3 py-2 rounded-lg border border-neutral-700/50 transition-colors"
                  >
                    ▶ Escuchar / Ver recurso multimedia
                  </a>
                </div>
              )}

              {/* Bloque de Precio (si aplica) */}
              {post.price > 0 && (
                <div className="flex items-center justify-between pt-3 border-t border-neutral-800/60 text-xs">
                  <span className="text-neutral-400 font-medium">Edición Digital Directa</span>
                  <span className="font-mono bg-red-950/80 text-red-300 border border-red-800/50 px-2.5 py-1 rounded-md font-bold">
                    ${post.price} USD
                  </span>
                </div>
              )}
            </article>
          )
        })}
      </section>
    </main>
  )
}